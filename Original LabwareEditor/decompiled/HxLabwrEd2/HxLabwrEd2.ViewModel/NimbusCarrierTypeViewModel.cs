using System;
using System.Collections.Generic;
using System.Drawing;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class NimbusCarrierTypeViewModel : ViewModelBase
{
	private Dictionary<string, CarrierConfig> carrierConfigs;

	private Exception configException;

	public RelayCommand NavToNewLabwareVM { get; }

	public RelayCommand NavToNimbusFlexCarrierTypeVM { get; }

	public RelayCommand NavToNimbusPedestalVM { get; }

	public NimbusCarrierTypeViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		//IL_0044: Unknown result type (might be due to invalid IL or missing references)
		//IL_004e: Expected O, but got Unknown
		NavToNewLabwareVM = new RelayCommand((Action)ExecuteNavToNewLabwareVM, false);
		NavToNimbusFlexCarrierTypeVM = new RelayCommand((Action)ExecuteNavToNimbusFlexCarrierTypeVM, false);
		NavToNimbusPedestalVM = new RelayCommand((Action)ExecuteNavToNimbusPedestalVM, false);
		ReadCarrierConfigFile();
	}

	private void ExecuteNavToNewLabwareVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
	}

	private void ExecuteNavToNimbusFlexCarrierTypeVM()
	{
		if (configException == null)
		{
			SimpleIoc.Default.GetInstance<NimbusFlexCarrierTypeViewModel>();
			Messenger.Default.Send<GenericMessage<Dictionary<string, CarrierConfig>>>(new GenericMessage<Dictionary<string, CarrierConfig>>(carrierConfigs), (object)"SetupNimbusFlexCarrierTypes");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusFlexCarrierTypeViewModel>()), (object)"Navigation");
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
			carrierConfigs = MultiflexConfigFileHelper.ReadCarrierConfigFile(HxRegHelper.ConfigPath + "\\NimbusCarriers.xml");
		}
		catch (Exception ex)
		{
			configException = ex;
		}
	}

	private void ExecuteNavToNimbusPedestalVM()
	{
		Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationNimbusPedestalViewModel>()), (object)"Navigation");
		Template template = new Template
		{
			Dimensions = new Dimensions(140.0, 100.0, 100.0),
			Clearance = 105.0,
			BackgroundColor = Color.FromArgb(0, 192, 192, 192)
		};
		Site item = new Site
		{
			Id = "1",
			Position = 1,
			Dimensions = new Dimensions(127.0, 86.0, 0.0),
			OffsetsToParentOrigin = new Offsets(6.5, 7.0, 92.37)
		};
		template.Sites.Add(item);
		Messenger.Default.Send<GenericMessage<Template>>(new GenericMessage<Template>(template), (object)"CreateNimbusPedestal");
	}
}
