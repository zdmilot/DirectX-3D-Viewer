using System;
using System.Windows;
using System.Windows.Interop;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

public static class SecurityAndConfigurationManager
{
	public static ViewModelBase CurrentViewModel { get; set; }

	public static void AppAccessCheck()
	{
		HxUserManagerHelper.SubscribeToLogonEvents();
		if (!HxRegHelper.FunctionProtection)
		{
			return;
		}
		if (HxRegHelper.UseInternalLogon)
		{
			if (string.IsNullOrEmpty(HxSecurityComHelper.CurrentUserName))
			{
				Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowApplication");
				IntPtr handle = new WindowInteropHelper(WindowShadowHelper.ShadowWindowReference).Handle;
				try
				{
					CheckLogonResult(HxUserManagerHelper.ShowLogOnDialog((int)handle));
					return;
				}
				catch (Exception ex)
				{
					ExceptionShutDown(ex.Message);
					return;
				}
			}
			UpdateCurrentViewModelsFlags();
		}
		else if (HxSecurityComHelper.CurrentAccessRight == AccessRight.NoAccess)
		{
			NoAccessShutDown();
		}
	}

	public static void ChangeUser()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ShadowApplication");
		IntPtr handle = new WindowInteropHelper(WindowShadowHelper.ShadowWindowReference).Handle;
		try
		{
			CheckLogonResult(HxUserManagerHelper.ShowLogOnDialog((int)handle));
		}
		catch (Exception ex)
		{
			ExceptionShutDown(ex.Message);
		}
	}

	private static void CheckLogonResult(int result)
	{
		switch (result)
		{
		case 1:
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
			break;
		case 2:
			if (string.IsNullOrEmpty(HxSecurityComHelper.CurrentUserName))
			{
				NoAccessShutDown();
			}
			else
			{
				Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnshadowApplication");
			}
			break;
		}
	}

	public static void UpdateViewModelFlags(ViewModelBase viewModel)
	{
		CurrentViewModel = viewModel;
		UpdateCurrentViewModelsFlags();
	}

	public static void UpdateCurrentViewModelsFlags()
	{
		AccessRight currentAccessRight = HxSecurityComHelper.CurrentAccessRight;
		string currentUserName = HxSecurityComHelper.CurrentUserName;
		bool fileValidation = HxRegHelper.FileValidation;
		bool fileProtection = HxRegHelper.FileProtection;
		bool functionProtection = HxRegHelper.FunctionProtection;
		bool useInternalLogon = HxRegHelper.UseInternalLogon;
		AuditTrail useAuditTrail = HxRegHelper.UseAuditTrail;
		if (functionProtection && currentAccessRight == AccessRight.NoAccess)
		{
			AccessLostShutDown();
		}
		if (CurrentViewModel is TitlePageViewModel)
		{
			TitlePageViewModel titlePageViewModel = CurrentViewModel as TitlePageViewModel;
			if (functionProtection && useInternalLogon)
			{
				titlePageViewModel.InternalLogon = true;
				titlePageViewModel.UserName = currentUserName;
			}
			AppTitleHelper.ResetTitle();
		}
		else if (CurrentViewModel is NewLabwareViewModel)
		{
			AppTitleHelper.UpdateTitle("Create New Labware");
		}
		else if (CurrentViewModel is NimbusCarrierTypeViewModel)
		{
			AppTitleHelper.UpdateTitle("Create New Labware - Nimbus");
		}
		else if (CurrentViewModel is NimbusFlexCarrierTypeViewModel)
		{
			AppTitleHelper.UpdateTitle("Create New Labware - Nimbus - Multiflex Carrier");
		}
		else if (CurrentViewModel is StarCarrierTypeViewModel)
		{
			AppTitleHelper.UpdateTitle("Create New Labware - STAR");
		}
		else if (CurrentViewModel is StarFlexCarrierTypeViewModel)
		{
			AppTitleHelper.UpdateTitle("Create New Labware - STAR - Multiflex Carrier");
		}
		else if (CurrentViewModel is CreationViewModelBase)
		{
			CreationViewModelBase creationViewModelBase = CurrentViewModel as CreationViewModelBase;
			if (functionProtection)
			{
				if (currentAccessRight == AccessRight.Operator || currentAccessRight == AccessRight.Operator2)
				{
					creationViewModelBase.SaveAllowed = false;
				}
				else
				{
					creationViewModelBase.SaveAllowed = true;
				}
			}
			else
			{
				creationViewModelBase.SaveAllowed = true;
			}
			creationViewModelBase.UpdateShowSecurityTip();
			if (CurrentViewModel is CreationCircularRackViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Circular Rack");
			}
			else if (CurrentViewModel is CreationContainerViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Container");
			}
			else if (CurrentViewModel is CreationIrregularRackViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Irregular Rectangualr Rack");
			}
			else if (CurrentViewModel is CreationMicrotiterPlateViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Microtiter Plate");
			}
			else if (CurrentViewModel is CreationNimbusFlexCarrierViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Nimbus - Multiflex Carrier - " + (CurrentViewModel as CreationNimbusFlexCarrierViewModel).CarrierName);
			}
			else if (CurrentViewModel is CreationNimbusPedestalViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Nimbus - Pedestal");
			}
			else if (CurrentViewModel is CreationRegularRackViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Regular Rectangualr Rack");
			}
			else if (CurrentViewModel is CreationStarFlexCarrierViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - STAR - Multiflex Carrier - " + (CurrentViewModel as CreationStarFlexCarrierViewModel).CarrierName);
			}
			else if (CurrentViewModel is CreationTemplateCustomViewModel)
			{
				AppTitleHelper.UpdateTitle("Create New Labware - Custom Template");
			}
			else
			{
				AppTitleHelper.ResetTitle();
			}
		}
		else if (CurrentViewModel is LoadedViewModelBase)
		{
			LoadedViewModelBase loadedViewModelBase = CurrentViewModel as LoadedViewModelBase;
			if (fileValidation)
			{
				loadedViewModelBase.ValidateButtonVisible = true;
			}
			else
			{
				loadedViewModelBase.ValidateButtonVisible = false;
			}
			if (useAuditTrail == AuditTrail.AuditTrailEnabled || useAuditTrail == AuditTrail.AuditTrailForced)
			{
				loadedViewModelBase.ViewHistoryButtonVisible = true;
			}
			else
			{
				loadedViewModelBase.ViewHistoryButtonVisible = false;
			}
			if (CommandLineArgumentHelper.LimitedFlag)
			{
				loadedViewModelBase.SaveAndValidationAllowed = false;
			}
			else if (functionProtection)
			{
				loadedViewModelBase.SaveAndValidationAllowed = currentAccessRight == AccessRight.AllAccess || currentAccessRight == AccessRight.Programmer;
			}
			else
			{
				loadedViewModelBase.SaveAndValidationAllowed = true;
			}
			if (!CommandLineArgumentHelper.LimitedFlag && functionProtection && !loadedViewModelBase.SaveAndValidationAllowed)
			{
				loadedViewModelBase.DisplayGroupAndPrivilageWarning = true;
			}
			if ((functionProtection && (currentAccessRight == AccessRight.Operator || currentAccessRight == AccessRight.Operator2)) || (fileProtection && loadedViewModelBase.LoadedLabware.IsHamiltonOriginalLabware) || loadedViewModelBase.LoadedLabware.FileIsReadOnly || CommandLineArgumentHelper.LimitedFlag)
			{
				loadedViewModelBase.LoadedLabware.ReadOnly = true;
			}
			else
			{
				loadedViewModelBase.LoadedLabware.ReadOnly = false;
			}
			AppTitleHelper.UpdateTitle(loadedViewModelBase.LoadedLabware);
		}
		else if (CurrentViewModel is CategoryFilterManagerViewModel)
		{
			AppTitleHelper.UpdateTitle("Manage Labware Categories and Filters");
		}
		else
		{
			AppTitleHelper.ResetTitle();
		}
	}

	private static void NoAccessShutDown()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "Access to HxLabwrEd2.exe is denied. Verify your user group and privileges with your administrator.", 0.5, 0.2);
		Application.Current.Shutdown();
	}

	private static void AccessLostShutDown()
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "Access to HxLabwrEd2.exe is lost. Verify your user group and privileges with your administrator.", 0.5, 0.2);
		Application.Current.Shutdown();
	}

	private static void ExceptionShutDown(string exceptionError)
	{
		DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), exceptionError, 0.45, 0.35);
		Application.Current.Shutdown();
	}
}
