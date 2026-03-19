using System;
using System.Windows;
using System.Windows.Threading;
using Hamilton.Interop.HxUserManager;

namespace HxLabwrEd2.StaticHelpers;

internal static class HxUserManagerHelper
{
	private static readonly HxUserManagerClass hxUserManager = new HxUserManagerClass();

	public static void SubscribeToLogonEvents()
	{
		hxUserManager.UserLoggedOn += HxUserManager_UserLoggedOn;
		hxUserManager.UserLoggedOff += HxUserManager_UserLoggedOff;
	}

	private static void HxUserManager_UserLoggedOn()
	{
		Application.Current.Dispatcher.BeginInvoke((Action)delegate
		{
			SecurityAndConfigurationManager.UpdateCurrentViewModelsFlags();
		}, DispatcherPriority.Send, null);
	}

	private static void HxUserManager_UserLoggedOff()
	{
	}

	public static int ShowLogOnDialog(int parentWindowHandle)
	{
		return hxUserManager.LogOnDialog(parentWindowHandle);
	}
}
