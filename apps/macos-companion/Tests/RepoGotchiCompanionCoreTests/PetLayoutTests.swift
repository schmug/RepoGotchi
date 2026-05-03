import XCTest
@testable import RepoGotchiCompanionCore

final class PetLayoutTests: XCTestCase {
    func testPathsAnchorOnHomeRepogotchi() {
        let home = URL(fileURLWithPath: "/Users/test")
        let paths = PetLayout.paths(for: "abc123def456", home: home)
        XCTAssertEqual(paths.base.path, "/Users/test/.repogotchi/pets/abc123def456")
        XCTAssertEqual(paths.pet.lastPathComponent, "pet.json")
        XCTAssertEqual(paths.state.lastPathComponent, "state.json")
        XCTAssertEqual(paths.svg.lastPathComponent, "pet.svg")
    }

    func testPetsRootIsHomeRepogotchiPets() {
        let home = URL(fileURLWithPath: "/Users/test")
        XCTAssertEqual(
            PetLayout.petsRoot(home: home).path,
            "/Users/test/.repogotchi/pets"
        )
    }
}
