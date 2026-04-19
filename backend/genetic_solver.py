import random
import math

class GeneticRouteOptimizer:
    def __init__(self, locations, population_size=100, generations=300):
        self.locations = locations  # List of {lat, lng, name, ...}
        self.pop_size = population_size
        self.generations = generations
        # Pre-compute distance matrix for speed
        self.dist_matrix = self._build_distance_matrix()

    def _haversine(self, p1, p2):
        """Calculate real-world distance in km between two lat/lng points."""
        R = 6371  # Earth radius in km
        lat1, lng1 = math.radians(p1['lat']), math.radians(p1['lng'])
        lat2, lng2 = math.radians(p2['lat']), math.radians(p2['lng'])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _build_distance_matrix(self):
        n = len(self.locations)
        matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(i + 1, n):
                d = self._haversine(self.locations[i], self.locations[j])
                matrix[i][j] = d
                matrix[j][i] = d
        return matrix

    def total_route_distance(self, route_indices):
        distance = 0
        for i in range(len(route_indices) - 1):
            distance += self.dist_matrix[route_indices[i]][route_indices[i + 1]]
        return distance

    def _nearest_neighbor_route(self):
        """Greedy nearest-neighbor heuristic starting from index 0."""
        n = len(self.locations)
        visited = {0}
        route = [0]
        current = 0
        for _ in range(n - 1):
            nearest = min(
                (j for j in range(n) if j not in visited),
                key=lambda j: self.dist_matrix[current][j]
            )
            route.append(nearest)
            visited.add(nearest)
            current = nearest
        return route

    def solve(self):
        num_locs = len(self.locations)
        if num_locs <= 2:
            return self.locations  # Nothing to optimize

        # Index 0 is ALWAYS the starting point (first place user added)
        other_indices = list(range(1, num_locs))

        # Seed population with a smart nearest-neighbor route
        nn_route = self._nearest_neighbor_route()
        population = [nn_route]

        # Fill the rest with random permutations (start fixed at 0)
        for _ in range(self.pop_size - 1):
            shuffled = random.sample(other_indices, len(other_indices))
            population.append([0] + shuffled)

        for gen in range(self.generations):
            # Sort by fitness (shorter = better)
            population = sorted(population, key=lambda x: self.total_route_distance(x))

            # Elitism: keep top 20%
            elite_count = max(2, self.pop_size // 5)
            new_population = population[:elite_count]

            while len(new_population) < self.pop_size:
                parent = random.choice(population[:self.pop_size // 2])
                child = parent[:]

                mutation_roll = random.random()
                if mutation_roll < 0.4 and num_locs > 2:
                    # Swap mutation (don't touch index 0)
                    idx1, idx2 = random.sample(range(1, num_locs), 2)
                    child[idx1], child[idx2] = child[idx2], child[idx1]
                elif mutation_roll < 0.7 and num_locs > 3:
                    # Reverse segment (2-opt style)
                    idx1, idx2 = sorted(random.sample(range(1, num_locs), 2))
                    child[idx1:idx2 + 1] = reversed(child[idx1:idx2 + 1])
                elif num_locs > 3:
                    # Insert mutation: move a random element to a random position
                    src = random.randint(1, num_locs - 1)
                    dest = random.randint(1, num_locs - 1)
                    gene = child.pop(src)
                    child.insert(dest, gene)

                new_population.append(child)

            population = new_population

        best_route_indices = population[0]
        print(f"[GA] Best distance: {self.total_route_distance(best_route_indices):.2f} km")
        return [self.locations[i] for i in best_route_indices]