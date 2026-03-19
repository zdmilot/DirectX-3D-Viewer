using System;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using Hamilton.Interop.HxAuditTrail;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

public static class HxAuditTrailHelper
{
	private static readonly HxAuditTrailClass hxAuditTrail = new HxAuditTrailClass();

	public static void ShowAuditTrail(string labwareFullPath)
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowApplication");
		IntPtr handle = new WindowInteropHelper(WindowShadowHelper.ShadowWindowReference).Handle;
		hxAuditTrail.IHxAuditTrail2_ShowAuditTrailInfoFromFile((int)handle, labwareFullPath);
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
	}

	public static bool EnterChangeDataForFile(string labwareFullPath, bool clearAuditHistory)
	{
		if (clearAuditHistory && !ResetAuditTrailDataInFile(labwareFullPath))
		{
			return false;
		}
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowApplication");
		IntPtr handle = new WindowInteropHelper(WindowShadowHelper.ShadowWindowReference).Handle;
		int num = hxAuditTrail.IHxAuditTrail2_EnterChangeDataForFile((int)handle, labwareFullPath);
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
		if (num == 0)
		{
			return true;
		}
		return false;
	}

	public static bool EnterValidationDataForFile(string labwareFullPath)
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowApplication");
		IntPtr handle = new WindowInteropHelper(WindowShadowHelper.ShadowWindowReference).Handle;
		int num = hxAuditTrail.IHxAuditTrail2_EnterValidationDataForFile((int)handle, labwareFullPath);
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
		if (num == 0)
		{
			return true;
		}
		return false;
	}

	public static bool ResetAuditTrailDataInFile(string labwareFullPath)
	{
		try
		{
			hxAuditTrail.IHxAuditTrail2_ResetAuditTrailDataInFile(labwareFullPath);
		}
		catch (Exception ex)
		{
			string trimmedMessage = ex.Message.TrimEnd(Environment.NewLine.ToCharArray());
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), trimmedMessage, 0.45, 0.35);
			}, DispatcherPriority.Background, null);
			return false;
		}
		return true;
	}
}
