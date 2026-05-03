import Foundation

public struct PetPaths: Equatable, Sendable {
    public let base: URL
    public let pet: URL
    public let state: URL
    public let svg: URL

    public init(base: URL) {
        self.base = base
        self.pet = base.appendingPathComponent("pet.json")
        self.state = base.appendingPathComponent("state.json")
        self.svg = base.appendingPathComponent("pet.svg")
    }
}

public enum PetLayout {
    /// ~/.repogotchi/pets/
    public static func petsRoot(home: URL = FileManager.default.homeDirectoryForCurrentUser) -> URL {
        home.appendingPathComponent(".repogotchi", isDirectory: true)
            .appendingPathComponent("pets", isDirectory: true)
    }

    /// ~/.repogotchi/pets/<petId>/{pet,state}.json + pet.svg
    public static func paths(for petId: String, home: URL = FileManager.default.homeDirectoryForCurrentUser) -> PetPaths {
        PetPaths(base: petsRoot(home: home).appendingPathComponent(petId, isDirectory: true))
    }
}
