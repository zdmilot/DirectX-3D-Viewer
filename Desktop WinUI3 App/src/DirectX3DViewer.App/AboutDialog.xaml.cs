using Microsoft.UI.Xaml.Controls;

namespace DirectX3DViewer.App;

public sealed partial class AboutDialog : ContentDialog
{
    public AboutDialog()
    {
        InitializeComponent();
        this.EnableLightDismiss();
    }
}
