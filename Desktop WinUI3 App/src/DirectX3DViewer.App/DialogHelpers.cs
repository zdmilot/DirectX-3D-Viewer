using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;

namespace DirectX3DViewer.App;

/// <summary>Helpers for ContentDialog behavior shared across dialogs.</summary>
internal static class DialogHelpers
{
    /// <summary>
    /// Lets the user dismiss a ContentDialog by clicking the dimmed area outside the
    /// dialog box. ContentDialog has no built-in light-dismiss, so we attach a tap
    /// handler to its template's full-window smoke layer ("LayoutRoot") and close when
    /// the tap did not land inside the dialog box ("BackgroundElement").
    /// </summary>
    public static void EnableLightDismiss(this ContentDialog dialog)
    {
        dialog.Opened += (_, _) =>
        {
            var layoutRoot = FindByName(dialog, "LayoutRoot");
            var box = FindByName(dialog, "BackgroundElement");
            if (layoutRoot is FrameworkElement lr && box is DependencyObject boxObj)
            {
                lr.Tapped += (_, e) =>
                {
                    if (e.OriginalSource is DependencyObject src && !IsDescendant(src, boxObj))
                        dialog.Hide();
                };
            }
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

    private static bool IsDescendant(DependencyObject? node, DependencyObject ancestor)
    {
        while (node is not null)
        {
            if (node == ancestor) return true;
            node = VisualTreeHelper.GetParent(node);
        }
        return false;
    }
}
