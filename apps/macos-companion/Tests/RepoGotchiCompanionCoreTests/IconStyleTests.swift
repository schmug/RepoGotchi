import XCTest
import RepoGotchiContract
@testable import RepoGotchiCompanionCore

final class IconStyleTests: XCTestCase {
    func testEachMoodMapsToASymbolAndAccessibilityLabel() {
        for mood in Mood.allCases {
            let snap = makeSnapshot(mood: mood, headline: "test")
            let style = IconStyleResolver.style(for: snap)
            XCTAssertFalse(style.symbol.isEmpty, "mood \(mood) has no symbol")
            XCTAssertTrue(style.accessibilityLabel.contains("test"), "mood \(mood) is missing headline in label")
        }
    }

    func testHappyMoodIsPink() {
        let snap = makeSnapshot(mood: .happy)
        XCTAssertEqual(IconStyleResolver.style(for: snap).tint, .pink)
    }

    func testSickMoodIsOrangeTriangle() {
        let snap = makeSnapshot(mood: .sick)
        let style = IconStyleResolver.style(for: snap)
        XCTAssertEqual(style.tint, .orange)
        XCTAssertEqual(style.symbol, "exclamationmark.triangle.fill")
    }
}

extension Mood: CaseIterable {
    public static var allCases: [Mood] {
        [.happy, .sad, .sick, .angry, .sleepy, .excited, .ghost]
    }
}

func makeSnapshot(mood: Mood = .happy, headline: String = "Test") -> PetSnapshot {
    let pet = Pet(
        bornAt: Date(),
        id: "a3f5b8c2d1e0",
        name: "Tester",
        palette: Palette(accent: "#FFD700", outline: "#1A1A1A", primary: "#3178C6", secondary: "#1E4E8E"),
        personality: "",
        repo: Repo(host: .github, name: "RepoGotchi", owner: "schmug"),
        schemaVersion: 1,
        species: "blob",
        traits: [],
        visualPrompt: nil
    )
    let state = State(
        computedAt: Date(),
        evolutionStage: .juvenile,
        level: 5,
        mood: mood,
        petID: pet.id,
        schemaVersion: 1,
        scores: Scores(cleanliness: 80, energy: 60, happiness: 70, health: 75),
        signals: Signals(
            ciStatus: nil,
            contributors: 4,
            hasUncommittedChanges: false,
            isArchived: false,
            lastCommitDaysAgo: 1,
            openIssues: 3,
            openPullRequests: 1,
            stars: 12,
            testStatus: nil
        ),
        source: .cli,
        statusHeadline: headline
    )
    let paths = PetPaths(base: URL(fileURLWithPath: "/tmp/\(pet.id)"))
    return PetSnapshot(pet: pet, state: state, paths: paths, observedAt: Date())
}
