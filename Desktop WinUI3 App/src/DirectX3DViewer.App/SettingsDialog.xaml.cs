namespace DirectX3DViewer.App;

public sealed partial class SettingsDialog : Microsoft.UI.Xaml.Controls.ContentDialog
{
    private readonly MainWindow? _owner;
    private readonly bool _ready;

    public SettingsDialog(MainWindow? owner = null)
    {
        InitializeComponent();
        this.EnableLightDismiss();
        _owner = owner;

        // Seed the controls from the current state before wiring becomes "live".
        if (owner is not null)
        {
            WireframeToggle.IsOn = owner.PrefWireframe;
            GridToggle.IsOn = owner.PrefGrid;
            ThemeToggle.IsOn = owner.PrefDark;
            ProjectionCombo.SelectedIndex = owner.PrefPerspective ? 0 : 1;
        }
        _ready = true;
    }

    private void OnProjectionSelectionChanged(object sender, Microsoft.UI.Xaml.Controls.SelectionChangedEventArgs e)
    {
        if (_ready) _owner?.SetPrefPerspective(ProjectionCombo.SelectedIndex == 0);
    }

    private void OnWireframeToggled(object sender, Microsoft.UI.Xaml.RoutedEventArgs e)
    {
        if (_ready) _owner?.SetPrefWireframe(WireframeToggle.IsOn);
    }

    private void OnGridToggled(object sender, Microsoft.UI.Xaml.RoutedEventArgs e)
    {
        if (_ready) _owner?.SetPrefGrid(GridToggle.IsOn);
    }

    private void OnThemeToggled(object sender, Microsoft.UI.Xaml.RoutedEventArgs e)
    {
        if (_ready) _owner?.SetPrefDark(ThemeToggle.IsOn);
    }
}
