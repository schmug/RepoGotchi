import Foundation
import RepoGotchiContract

/// Pet identity + current state, as observed at a point in time.
public struct PetSnapshot: Equatable, Sendable {
    public let pet: Pet
    public let state: State
    public let paths: PetPaths
    public let observedAt: Date

    public init(pet: Pet, state: State, paths: PetPaths, observedAt: Date) {
        self.pet = pet
        self.state = state
        self.paths = paths
        self.observedAt = observedAt
    }
}

public enum PetLoadError: Error, Equatable {
    case missing(URL)
    case decode(String)
}

public enum PetLoader {
    public static func load(_ paths: PetPaths) throws -> PetSnapshot {
        let pet = try decode(Pet.self, at: paths.pet)
        let state = try decode(State.self, at: paths.state)
        return PetSnapshot(pet: pet, state: state, paths: paths, observedAt: Date())
    }

    private static func decode<T: Decodable>(_ type: T.Type, at url: URL) throws -> T {
        guard FileManager.default.fileExists(atPath: url.path) else {
            throw PetLoadError.missing(url)
        }
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw PetLoadError.decode("\(url.lastPathComponent): \(error)")
        }
    }
}
