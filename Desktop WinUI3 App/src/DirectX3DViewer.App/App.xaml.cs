using System;
using System.IO;
using System.Runtime.InteropServices;
using Microsoft.UI.Xaml;
using DirectX3DViewer.Core.Formats;

namespace DirectX3DViewer.App;

public partial class App : Application
{
    private Window? _window;

    [DllImport("kernel32.dll")] private static extern bool AllocConsole();
    [DllImport("kernel32.dll")] private static extern bool AttachConsole(int dwProcessId);
    private const int AttachParentProcess = -1;

    public App()
    {
        InitializeComponent();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var cmdArgs = Environment.GetCommandLineArgs();

        // ── CLI mode detection ────────────────────────────────────────────
        if (cmdArgs.Length >= 2)
        {
            string verb = cmdArgs[1].ToLowerInvariant().TrimStart('-');
            if (verb == "help" || verb == "h" || verb == "?")
            {
                AttachOrAllocConsole();
                PrintHelp();
                Exit();
                return;
            }
            if (verb == "convert")
            {
                AttachOrAllocConsole();
                Environment.ExitCode = RunConvert(cmdArgs);
                Exit();
                return;
            }
        }

        // ── GUI mode ──────────────────────────────────────────────────────
        var main = new MainWindow();
        _window = main;
        main.Activate();

        // Open a file passed via command line / file association.
        for (int i = 1; i < cmdArgs.Length; i++)
        {
            if (File.Exists(cmdArgs[i])) { main.OpenInitialFile(cmdArgs[i]); break; }
        }
    }

    // ── Console helpers ───────────────────────────────────────────────────────────

    private static void AttachOrAllocConsole()
    {
        if (!AttachConsole(AttachParentProcess))
            AllocConsole();

        // Re-open stdout/stderr so Console.Write works after attachment.
        Console.SetOut(new System.IO.StreamWriter(Console.OpenStandardOutput()) { AutoFlush = true });
        Console.SetError(new System.IO.StreamWriter(Console.OpenStandardError()) { AutoFlush = true });
    }

    // ── CLI: help ─────────────────────────────────────────────────────────────────

    private static void PrintHelp()
    {
        Console.WriteLine();
        Console.WriteLine("DirectX 3D Viewer  \u2014  CLI Reference");
        Console.WriteLine("=====================================");
        Console.WriteLine();
        Console.WriteLine("USAGE");
        Console.WriteLine("  DirectX3DViewer.exe [command] [options]");
        Console.WriteLine();
        Console.WriteLine("COMMANDS");
        Console.WriteLine("  <file>                   Open a 3D file in the viewer GUI");
        Console.WriteLine("  convert <in> <out>       Convert a 3D file between formats");
        Console.WriteLine("  help | --help | -h       Show this help text");
        Console.WriteLine();
        Console.WriteLine("CONVERT OPTIONS");
        Console.WriteLine("  --format <fmt>           Force output format (x | obj | stl | glb)");
        Console.WriteLine("                           Inferred from output file extension when omitted.");
        Console.WriteLine();
        Console.WriteLine("SUPPORTED FORMATS");
        Console.WriteLine("  Input :  .x   .hxx   .obj   .stl");
        Console.WriteLine("  Output:  .x   .obj   .stl   .glb");
        Console.WriteLine();
        Console.WriteLine("EXAMPLES");
        Console.WriteLine("  DirectX3DViewer.exe model.x");
        Console.WriteLine("      Opens model.x in the viewer GUI.");
        Console.WriteLine();
        Console.WriteLine("  DirectX3DViewer.exe convert model.obj model.x");
        Console.WriteLine("      Converts model.obj \u2192 model.x  (DirectX .X binary).");
        Console.WriteLine();
        Console.WriteLine("  DirectX3DViewer.exe convert model.stl output.glb");
        Console.WriteLine("      Converts model.stl \u2192 output.glb  (glTF 2.0 binary).");
        Console.WriteLine();
        Console.WriteLine("  DirectX3DViewer.exe convert model.x result.obj --format obj");
        Console.WriteLine("      Converts model.x \u2192 result.obj  (format flag overrides extension).");
        Console.WriteLine();
        Console.WriteLine("EXIT CODES");
        Console.WriteLine("  0   Success");
        Console.WriteLine("  1   Conversion / IO error  (message printed to stderr)");
        Console.WriteLine("  2   Invalid arguments");
        Console.WriteLine();
    }

    // ── CLI: convert ──────────────────────────────────────────────────────────────

    private static int RunConvert(string[] args)
    {
        // args[0]=exe  args[1]="convert"  args[2]=<input>  args[3]=<output>  [args[4+]=flags]
        if (args.Length < 4)
        {
            Console.Error.WriteLine("Error: 'convert' requires both an input and an output path.");
            Console.Error.WriteLine("Usage: DirectX3DViewer.exe convert <input> <output> [--format <fmt>]");
            return 2;
        }

        string input  = args[2];
        string output = args[3];
        string? formatOverride = null;

        for (int i = 4; i < args.Length - 1; i++)
        {
            if (args[i].Equals("--format", StringComparison.OrdinalIgnoreCase) ||
                args[i].Equals("-f",       StringComparison.OrdinalIgnoreCase))
            {
                formatOverride = args[i + 1].ToLowerInvariant().TrimStart('.');
                i++;
            }
        }

        // Validate input
        if (!File.Exists(input))
        {
            Console.Error.WriteLine($"Error: Input file not found: {input}");
            return 1;
        }
        if (!ModelImporter.IsSupported(input))
        {
            Console.Error.WriteLine($"Error: Unsupported input format '{Path.GetExtension(input)}'.");
            Console.Error.WriteLine("       Supported input formats: .x  .hxx  .obj  .stl");
            return 1;
        }

        // Determine output format
        string fmt = formatOverride
                     ?? Path.GetExtension(output).TrimStart('.').ToLowerInvariant();
        string[] validFmts = { "x", "obj", "stl", "glb" };
        if (string.IsNullOrEmpty(fmt) || Array.IndexOf(validFmts, fmt) < 0)
        {
            Console.Error.WriteLine($"Error: Unknown or missing output format '{fmt}'.");
            Console.Error.WriteLine("       Supported output formats: x  obj  stl  glb");
            Console.Error.WriteLine("       Use --format <fmt> to specify explicitly.");
            return 1;
        }

        try
        {
            Console.Write($"  Reading  {Path.GetFileName(input)}  ...");
            var scene = ModelImporter.Import(input);
            Console.WriteLine(" OK");

            string? outDir = Path.GetDirectoryName(Path.GetFullPath(output));
            if (!string.IsNullOrEmpty(outDir)) Directory.CreateDirectory(outDir);

            Console.Write($"  Writing  {Path.GetFileName(output)}  ({fmt.ToUpperInvariant()})  ...");
            switch (fmt)
            {
                case "x":   XFileWriter.Write(scene, output);     break;
                case "obj": MeshExporters.WriteObj(scene, output); break;
                case "stl": MeshExporters.WriteStl(scene, output); break;
                case "glb": GlbWriter.Write(scene, output);        break;
            }
            Console.WriteLine(" OK");
            Console.WriteLine($"  Done \u2192 {Path.GetFullPath(output)}");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine();
            Console.Error.WriteLine($"Error: {ex.Message}");
            return 1;
        }
    }
}
