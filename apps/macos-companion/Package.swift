// swift-tools-version: 5.9
//
// RepoGotchi menubar companion. Watches ~/.repogotchi/pets/ for the
// pet/state files written by the CLI and renders the active pet in the
// macOS menubar with a click-popover for full state.

import PackageDescription

let package = Package(
    name: "RepoGotchiCompanion",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "RepoGotchiCompanion", targets: ["RepoGotchiApp"]),
        .library(name: "RepoGotchiCompanionCore", targets: ["RepoGotchiCompanionCore"]),
    ],
    dependencies: [
        .package(path: "../../packages/contract/swift"),
    ],
    targets: [
        .target(
            name: "RepoGotchiCompanionCore",
            dependencies: [.product(name: "RepoGotchiContract", package: "swift")],
            path: "Sources/RepoGotchiCompanionCore"
        ),
        .executableTarget(
            name: "RepoGotchiApp",
            dependencies: ["RepoGotchiCompanionCore"],
            path: "Sources/RepoGotchiApp"
        ),
        .testTarget(
            name: "RepoGotchiCompanionCoreTests",
            dependencies: ["RepoGotchiCompanionCore"],
            path: "Tests/RepoGotchiCompanionCoreTests"
        ),
    ]
)
