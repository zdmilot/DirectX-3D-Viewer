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

public class NimbusFlexCarrierTypeViewModel : ViewModelBase
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

	public RelayCommand NavToNimbusCarrierTypeVM { get; }

	public NimbusFlexCarrierTypeViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		NavToNimbusCarrierTypeVM = new RelayCommand((Action)ExecuteNavToNimbusCarrierTypeVM, false);
		Messenger.Default.Register<GenericMessage<Dictionary<string, CarrierConfig>>>((object)this, (object)"SetupNimbusFlexCarrierTypes", (Action<GenericMessage<Dictionary<string, CarrierConfig>>>)delegate(GenericMessage<Dictionary<string, CarrierConfig>> msg)
		{
			SetupButtons(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"NimbusFlexCarrierTypeSelected", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			CarrierTypeButtonClicked(msg.Content);
		}, false);
		LoadPedestalsConfigFile();
	}

	~NimbusFlexCarrierTypeViewModel()
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

	private void ExecuteNavToNimbusCarrierTypeVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusCarrierTypeViewModel>()), (object)"Navigation");
	}

	private void CarrierTypeButtonClicked(string carrierTypeClicked)
	{
		if (configException == null)
		{
			NimbusCarrier carrier = new NimbusCarrier(carrierConfigs[carrierTypeClicked]);
			CreationNimbusFlexCarrierViewModel instance = SimpleIoc.Default.GetInstance<CreationNimbusFlexCarrierViewModel>();
			Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(carrierTypeClicked), (object)"SetNimbusFlexCarrierName");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)instance), (object)"Navigation");
			FlexCarrierMessage flexCarrierMessage = new FlexCarrierMessage(carrier, pedestalConfig);
			Messenger.Default.Send<FlexCarrierMessage>(flexCarrierMessage, (object)"CreateNimbusFlexCarrierSetup");
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
			pedestalConfig = MultiflexConfigFileHelper.ReadNimbusPedestalsConfigFile(HxRegHelper.ConfigPath + "\\NimbusCarrierPedestals.xml");
		}
		catch (Exception ex)
		{
			configException = ex;
		}
	}
}
