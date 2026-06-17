using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Windows.Foundation;

namespace DirectX3DViewer.App;

/// <summary>Helpers for ContentDialog behavior shared across dialogs.</summary>
internal static class DialogHelpers
{
    /// <summary>
    /// Lets the user dismiss a ContentDialog by clicking anywhere outside the dialog
    /// box. ContentDialog has no built-in light-dismiss, so we attach a pointer handler
    /// to its template's full-window smoke layer ("LayoutRoot") and close when the press
    /// lands outside the dialog box ("BackgroundElement"). A geometric bounds test is
    /// used (rather than a visual-tree descendant check) so it works reliably even when
    /// the press is handled by inner content.
    /// </summary>
    public static void EnableLightDismiss(this ContentDialog dialog)
    {
        dialog.Opened += (_, _) =>
        {
            var layoutRoot = FindByName(dialog, "LayoutRoot") as FrameworkElement;
            var box = FindByName(dialog, "BackgroundElement") as FrameworkElement;
            if (layoutRoot is null || box is null) return;

            void OnPointerPressed(object sender, PointerRoutedEventArgs e)
            {
                var point = e.GetCurrentPoint(layoutRoot).Position;

                // Rect of the dialog box expressed in the smoke layer's coordinates.
                var topLeft = box.TransformToVisual(layoutRoot).TransformPoint(new Point(0, 0));
                var boxRect = new Rect(topLeft.X, topLeft.Y, box.ActualWidth, box.ActualHeight);

                if (!boxRect.Contains(point))
                    dialog.Hide();
            }

            // handledEventsToo: true so we still see the press even if a child marks it handled.
            layoutRoot.AddHandler(UIElement.PointerPressedEvent,
                new PointerEventHandler(OnPointerPressed), handledEventsToo: true);
        };
    }

    private static DependencyObject? FindByName(DependencyObject root, string name)
    {
        int count = VisualTreeHelper.GetChildrenCount(root);
        for (int i = 0; i < count; i++)
        {
            var child = VisualTreeHelper.GetChild(root, i);
            if (child is FrameworkElement fe && fe.Name == name) return child;
            var nested = FindByName(child, name);
            if (nested is not null) return nested;
        }
        return null;
    }
}
