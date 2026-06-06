using System;
using Microsoft.UI.Xaml;

namespace DirectX3DViewer.App;

public partial class App : Application
{
    private Window? _window;

    public App()
    {
        InitializeComponent();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        // The full window appears immediately and shows its own in-window splash
        // overlay while it loads (web-app style), then reveals the viewer.
        var main = new MainWindow();
        _window = main;
        main.Activate();

        // Open a file passed via command line / file association.
        var cmdArgs = Environment.GetCommandLineArgs();
        for (int i = 1; i < cmdArgs.Length; i++)
        {
            if (System.IO.File.Exists(cmdArgs[i])) { main.OpenInitialFile(cmdArgs[i]); break; }
        }
    }
}
