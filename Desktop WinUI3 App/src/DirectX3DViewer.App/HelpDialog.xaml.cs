namespace DirectX3DViewer.App;

public sealed partial class HelpDialog : Microsoft.UI.Xaml.Controls.ContentDialog
{
    public HelpDialog()
    {
        InitializeComponent();
        this.EnableLightDismiss();
    }

    private void OnCopyCommand(object sender, Microsoft.UI.Xaml.RoutedEventArgs e)
    {
        if (sender is not Microsoft.UI.Xaml.Controls.Button button ||
            button.Tag is not string command || string.IsNullOrEmpty(command))
            return;

        var package = new Windows.ApplicationModel.DataTransfer.DataPackage();
        package.SetText(command);
        Windows.ApplicationModel.DataTransfer.Clipboard.SetContent(package);

        // Briefly swap the copy glyph for a checkmark to confirm.
        if (button.Content is Microsoft.UI.Xaml.Controls.FontIcon icon)
        {
            icon.Glyph = "\uE73E"; // checkmark
            var timer = DispatcherQueue.CreateTimer();
            timer.Interval = System.TimeSpan.FromMilliseconds(1200);
            timer.IsRepeating = false;
            timer.Tick += (_, _) => icon.Glyph = "\uE8C8"; // copy
            timer.Start();
        }
    }
}
