import AppKit
import RepoGotchiCompanionCore

let app = NSApplication.shared
app.setActivationPolicy(.accessory) // Menubar-only; no Dock icon.

MainActor.assumeIsolated {
    let controller = MenubarController()
    controller.start()
    // Retain the controller for the app's lifetime by parking it on the
    // shared app's services list — NSApp only retains its delegate, not
    // ad-hoc objects.
    objc_setAssociatedObject(app, "RepoGotchiController", controller, .OBJC_ASSOCIATION_RETAIN)
}

app.run()
