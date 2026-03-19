using System.Windows;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.DialogWindows;

public class DialogService : IDialogService
{
	public bool? ShowDialogWithProportionalDimensions(string dialogTitle, object dialogDataContext, double proportionToParentWidth, double proportionToParentHeight)
	{
		return LaunchDialog((Window)(object)new DialogWindow(proportionToParentWidth, proportionToParentHeight), dialogTitle, dialogDataContext);
	}

	public bool? ShowDialogWithAbsoluteDimensions(string dialogTitle, object dialogDataContext, int width, int height)
	{
		return LaunchDialog((Window)(object)new DialogWindow(width, height), dialogTitle, dialogDataContext);
	}

	private static bool? LaunchDialog(Window window, string dialogTitle, object dialogDataContext)
	{
		if (WindowShadowHelper.ShadowWindowReference != null)
		{
			window.Owner = WindowShadowHelper.ShadowWindowReference;
		}
		window.Title = dialogTitle;
		window.DataContext = dialogDataContext;
		return window.ShowDialog();
	}
}
