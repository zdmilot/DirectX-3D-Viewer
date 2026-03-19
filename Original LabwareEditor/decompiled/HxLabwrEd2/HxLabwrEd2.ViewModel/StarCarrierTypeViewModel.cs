using System;
using System.Collections.Generic;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class StarCarrierTypeViewModel : ViewModelBase
{
	private Dictionary<string, CarrierConfig> carrierConfigs;

	private Exception configException;

	public RelayCommand NavToNewLabwareVM { get; }

	public RelayCommand NavToStarFlexCarrierTypeVM { get; }

	public StarCarrierTypeViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		NavToNewLabwareVM = new RelayCommand((Action)ExecuteNavToNewLabwareVM, false);
		NavToStarFlexCarrierTypeVM = new RelayCommand((Action)ExecuteNavToStarFlexCarrierTypeVM, false);
		ReadCarrierConfigFile();
	}

	private void ExecuteNavToNewLabwareVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
	}

	private void ExecuteNavToStarFlexCarrierTypeVM()
	{
		if (configException == null)
		{
			SimpleIoc.Default.GetInstance<StarFlexCarrierTypeViewModel>();
			Messenger.Default.Send<GenericMessage<Dictionary<string, CarrierConfig>>>(new GenericMessage<Dictionary<string, CarrierConfig>>(carrierConfigs), (object)"SetupStarFlexCarrierTypes");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<StarFlexCarrierTypeViewModel>()), (object)"Navigation");
		}
		else
		{
			DialogWindowHelper.ShowDialogWithProportionalDimensions("Config File Error", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "Unable to open Multiflex Carrier page due to the following error:\n" + configException.Message, 0.5, 0.25);
		}
	}

	private void ReadCarrierConfigFile()
	{
		try
		{
			carrierConfigs = MultiflexConfigFileHelper.ReadCarrierConfigFile(HxRegHelper.ConfigPath + "\\StarCarriers.xml");
		}
		catch (Exception ex)
		{
			configException = ex;
		}
	}
}
