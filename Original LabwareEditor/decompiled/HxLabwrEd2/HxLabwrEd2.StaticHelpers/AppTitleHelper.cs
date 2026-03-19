using System.Collections.Generic;
using System.IO;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

internal static class AppTitleHelper
{
	public static void UpdateTitle(string titleBarString)
	{
		if (string.IsNullOrEmpty(titleBarString))
		{
			ResetTitle();
		}
		Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(titleBarString), (object)"AppendToAppTitle");
	}

	public static void UpdateTitle(ViewModelBase viewModel)
	{
		if (viewModel is NewLabwareViewModel)
		{
			UpdateTitle("Create New Labware");
		}
		else if (viewModel is NimbusCarrierTypeViewModel)
		{
			UpdateTitle("Create New Labware - Nimbus");
		}
		else if (viewModel is NimbusFlexCarrierTypeViewModel)
		{
			UpdateTitle("Create New Labware - Nimbus - Multiflex Carrier");
		}
		else if (viewModel is StarCarrierTypeViewModel)
		{
			UpdateTitle("Create New Labware - STAR");
		}
		else if (viewModel is StarFlexCarrierTypeViewModel)
		{
			UpdateTitle("Create New Labware - STAR - Multiflex Carrier");
		}
		else if (viewModel is CreationViewModelBase)
		{
			if (viewModel is CreationCircularRackViewModel)
			{
				UpdateTitle("Create New Labware - Circular Rack");
			}
			else if (viewModel is CreationContainerViewModel)
			{
				UpdateTitle("Create New Labware - Container");
			}
			else if (viewModel is CreationIrregularRackViewModel)
			{
				UpdateTitle("Create New Labware - Irregular Rectangualr Rack");
			}
			else if (viewModel is CreationMicrotiterPlateViewModel)
			{
				UpdateTitle("Create New Labware - Microtiter Plate");
			}
			else if (viewModel is CreationNimbusFlexCarrierViewModel)
			{
				UpdateTitle("Create New Labware - Nimbus - Multiflex Carrier - " + (viewModel as CreationNimbusFlexCarrierViewModel).CarrierName);
			}
			else if (viewModel is CreationNimbusPedestalViewModel)
			{
				UpdateTitle("Create New Labware - Nimbus - Pedestal");
			}
			else if (viewModel is CreationRegularRackViewModel)
			{
				UpdateTitle("Create New Labware - Regular Rectangualr Rack");
			}
			else if (viewModel is CreationStarFlexCarrierViewModel)
			{
				UpdateTitle("Create New Labware - STAR - Multiflex Carrier - " + (viewModel as CreationStarFlexCarrierViewModel).CarrierName);
			}
			else if (viewModel is CreationTemplateCustomViewModel)
			{
				UpdateTitle("Create New Labware - Custom Template");
			}
			else
			{
				ResetTitle();
			}
		}
		else if (viewModel is LoadedViewModelBase)
		{
			UpdateTitle((ViewModelBase)(object)(viewModel as LoadedViewModelBase));
		}
		else if (viewModel is CategoryFilterManagerViewModel)
		{
			UpdateTitle("Manage Labware Categories and Filters");
		}
		else
		{
			ResetTitle();
		}
	}

	public static void UpdateTitle(Labware loadedLabware)
	{
		string text = "";
		if (HxRegHelper.FunctionProtection && HxRegHelper.UseInternalLogon)
		{
			text += HxSecurityComHelper.CurrentUserName;
		}
		if (loadedLabware != null)
		{
			if (!string.IsNullOrEmpty(text))
			{
				text += " - ";
			}
			text += Path.GetFileName(loadedLabware.LabwareFileFullPath);
			List<string> list = new List<string>();
			if (loadedLabware.ReadOnly)
			{
				list.Add("Read Only");
			}
			else if (loadedLabware.DataChanged)
			{
				list.Add("Modified");
			}
			if (HxRegHelper.FileValidation)
			{
				if (loadedLabware.Validation == FileValidation.Valid)
				{
					list.Add("Validated");
				}
				else
				{
					list.Add("Not Validated");
				}
			}
			if (list.Count > 0)
			{
				string text2 = " (";
				foreach (string item in list)
				{
					text2 += $"{item}; ";
				}
				text2 = text2.Remove(text2.Length - 2, 2) + ")";
				text += text2;
			}
		}
		Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(text), (object)"AppendToAppTitle");
	}

	public static void ResetTitle()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ResetAppTitle");
	}
}
