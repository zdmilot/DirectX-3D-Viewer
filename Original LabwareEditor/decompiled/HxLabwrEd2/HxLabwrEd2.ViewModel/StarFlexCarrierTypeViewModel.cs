using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class StarFlexCarrierTypeViewModel : ViewModelBase
{
	private Dictionary<string, CarrierConfig> carrierConfigs;

	private List<CarrierConfig> configButtons;

	private SortedDictionary<string, SortedDictionary<string, Pedestal>> pedestalConfig;

	private Exception configException;

	public List<CarrierConfig> ConfigButtons
	{
		get
		{
			return configButtons;
		}
		set
		{
			((ObservableObject)this).Set<List<CarrierConfig>>((Expression<Func<List<CarrierConfig>>>)(() => ConfigButtons), ref configButtons, value);
		}
	}

	public RelayCommand NavToStarCarrierTypeVM { get; }

	public StarFlexCarrierTypeViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		NavToStarCarrierTypeVM = new RelayCommand((Action)ExecuteNavToStarCarrierTypeVM, false);
		Messenger.Default.Register<GenericMessage<Dictionary<string, CarrierConfig>>>((object)this, (object)"SetupStarFlexCarrierTypes", (Action<GenericMessage<Dictionary<string, CarrierConfig>>>)delegate(GenericMessage<Dictionary<string, CarrierConfig>> msg)
		{
			SetupButtons(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"StarFlexCarrierTypeSelected", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			CarrierTypeButtonClicked(msg.Content);
		}, false);
		LoadPedestalsConfigFile();
	}

	~StarFlexCarrierTypeViewModel()
	{
		try
		{
			Messenger.Default.Unregister((object)this);
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void ExecuteNavToStarCarrierTypeVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<StarCarrierTypeViewModel>()), (object)"Navigation");
	}

	private void CarrierTypeButtonClicked(string carrierTypeClicked)
	{
		if (configException == null)
		{
			StarCarrier carrier = new StarCarrier(carrierConfigs[carrierTypeClicked]);
			CreationStarFlexCarrierViewModel instance = SimpleIoc.Default.GetInstance<CreationStarFlexCarrierViewModel>();
			Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(carrierTypeClicked), (object)"SetStarFlexCarrierName");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)instance), (object)"Navigation");
			FlexCarrierMessage flexCarrierMessage = new FlexCarrierMessage(carrier, pedestalConfig);
			Messenger.Default.Send<FlexCarrierMessage>(flexCarrierMessage, (object)"CreateStarFlexCarrierSetup");
		}
		else
		{
			DialogWindowHelper.ShowDialogWithProportionalDimensions("Config File Error", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), "Unable to open Multiflex Carrier page due to the following error:\n" + configException.Message, 0.5, 0.25);
		}
	}

	private void SetupButtons(Dictionary<string, CarrierConfig> sentCarrierConfigs)
	{
		if (carrierConfigs != null)
		{
			return;
		}
		carrierConfigs = sentCarrierConfigs;
		List<CarrierConfig> list = new List<CarrierConfig>();
		foreach (KeyValuePair<string, CarrierConfig> carrierConfig in carrierConfigs)
		{
			list.Add(carrierConfig.Value);
		}
		ConfigButtons = list;
	}

	private void LoadPedestalsConfigFile()
	{
		try
		{
			pedestalConfig = MultiflexConfigFileHelper.ReadStarPedestalsConfigFile(HxRegHelper.ConfigPath + "\\StarCarrierPedestals.xml");
		}
		catch (Exception ex)
		{
			configException = ex;
		}
	}
}
