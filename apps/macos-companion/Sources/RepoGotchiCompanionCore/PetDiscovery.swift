import Foundation

public enum PetDiscovery {
    /// All pet directories under ~/.repogotchi/pets/, newest state.json first.
    public static func availablePets(home: URL = FileManager.default.homeDirectoryForCurrentUser) -> [PetPaths] {
        let root = PetLayout.petsRoot(home: home)
        guard let entries = try? FileManager.default.contentsOfDirectory(
            at: root,
            includingPropertiesForKeys: [.contentModificationDateKey, .isDirectoryKey],
            options: [.skipsHiddenFiles]
        ) else {
            return []
        }

        return entries
            .filter { (try? $0.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true }
            .map { PetPaths(base: $0) }
            .filter { FileManager.default.fileExists(atPath: $0.state.path) }
            .sorted { lastModified($0.state) > lastModified($1.state) }
    }

    /// The most-recently-updated pet, or nil if none exist on disk.
    public static func mostRecent(home: URL = FileManager.default.homeDirectoryForCurrentUser) -> PetPaths? {
        availablePets(home: home).first
    }

    private static func lastModified(_ url: URL) -> Date {
        (try? url.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
    }
}
