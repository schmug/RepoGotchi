// swift-tools-version: 5.9
//
// SPM package exposing the RepoGotchi pet.json + state.json schemas as
// Swift Codable types. Sources are auto-generated from
// packages/contract/schemas/*.schema.json by `pnpm --filter
// @repogotchi/contract codegen`. Do not hand-edit Sources/.

import PackageDescription

let package = Package(
    name: "RepoGotchiContract",
    platforms: [.macOS(.v13)],
    products: [
        .library(name: "RepoGotchiContract", targets: ["RepoGotchiContract"]),
    ],
    targets: [
        .target(name: "RepoGotchiContract"),
    ]
)
