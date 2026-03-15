using System.Drawing;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Interop;

namespace HxLabwrEd2.StaticHelpers;

public static class WindowSizingHelper
{
	public static Rectangle GetWindowRectangle(this Window w)
	{
		if (w.WindowState == WindowState.Maximized)
		{
			return Screen.FromHandle(new WindowInteropHelper(w).Handle).WorkingArea;
		}
		return new Rectangle((int)w.Left, (int)w.Top, (int)w.ActualWidth, (int)w.ActualHeight);
	}
}
