using System;
using System.Collections.Generic;
using System.IO;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Threading;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.CustomControls;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class CreationNimbusFlexCarrierViewModel : CreationViewModelBase
{
	private SortedDictionary<string, SortedDictionary<string, Pedestal>> availablePedestals;

	private NimbusCarrier nimbusCarrier;

	private ModelJoinerWrapper modelJoinerWrapper;

	private string carrierName;

	public ModelJoinerWrapper ModelJoinerWrapper
	{
		get
		{
			return modelJoinerWrapper;
		}
		set
		{
			((ObservableObject)this).Set<ModelJoinerWrapper>((Expression<Func<ModelJoinerWrapper>>)(() => ModelJoinerWrapper), ref modelJoinerWrapper, value);
		}
	}

	public string CarrierName => carrierName;

	public RelayCommand LoadModelJoiner { get; }

	public CreationNimbusFlexCarrierViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		//IL_0050: Unknown result type (might be due to invalid IL or missing references)
		//IL_005a: Expected O, but got Unknown
		base.LeftButtonCommand = new RelayCommand((Action)ExecuteLeftButtonCommand, false);
		LoadModelJoiner = new RelayCommand((Action)ExecuteLoadModelJoiner, false);
		base.RightButtonCommand = new RelayCommand((Action)ExecuteRightButtonCommand, (Func<bool>)CanExecuteRightButtonCommand, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"SetNimbusFlexCarrierName", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			carrierName = msg.Content;
		}, false);
		Messenger.Default.Register<FlexCarrierMessage>((object)this, (object)"CreateNimbusFlexCarrierSetup", (Action<FlexCarrierMessage>)SetupModelJoiner, false);
		Messenger.Default.Register<GenericMessage<bool>>((object)this, (object)"UpdateNimbusFlexRightButton", (Action<GenericMessage<bool>>)delegate(GenericMessage<bool> msg)
		{
			UpdateCanContinue(msg.Content);
		}, false);
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusFlexCarrierPedestalSelectorViewModel>();
		SimpleIoc.Default.GetInstance<NimbusFlexCarrierPropertiesViewModel>();
	}

	~CreationNimbusFlexCarrierViewModel()
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

	private void ExecuteLeftButtonCommand()
	{
		if (rightButtonContent == "Continue")
		{
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ResetNimbusFlexCarrierReferences");
			nimbusCarrier = null;
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusFlexCarrierTypeViewModel>()), (object)"Navigation");
			return;
		}
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusFlexCarrierPedestalSelectorViewModel>();
		base.RightButtonContent = "Continue";
		nimbusCarrier.Name = "";
		nimbusCarrier.Description = "";
		nimbusCarrier.Image = "";
		nimbusCarrier.Bitmap = "";
	}

	private void ExecuteRightButtonCommand()
	{
		if (base.RightButtonContent == "Continue")
		{
			base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusFlexCarrierPropertiesViewModel>();
			base.RightButtonContent = "Save";
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"GenerateNimbusPedestals");
			return;
		}
		try
		{
			SaveFileDialog saveFileDialog = new SaveFileDialog();
			saveFileDialog.Filter = "Nimbus Carrier (Template)|*.tml";
			saveFileDialog.InitialDirectory = Environment.CurrentDirectory;
			saveFileDialog.FileName = ((!string.IsNullOrWhiteSpace(nimbusCarrier.Name)) ? nimbusCarrier.Name : "");
			if (saveFileDialog.ShowDialog() == true)
			{
				string text = saveFileDialog.FileName;
				string text2 = (nimbusCarrier.Model = Path.GetDirectoryName(text) + Path.DirectorySeparatorChar + Path.GetFileNameWithoutExtension(text) + ".x");
				string text4 = text2;
				nimbusCarrier.Model = text4;
				string pattern = "^.*\\.(tml|TML)$";
				if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
				{
					text += ".tml";
				}
				nimbusCarrier.LabwareFileFullPath = text;
				if (!ConfigFileWriter.Save(nimbusCarrier, clearAuditHistory: true))
				{
					return;
				}
				Messenger.Default.Send<GenericMessage<string>>(new GenericMessage<string>(text4), (object)"SaveModel");
				Labware labware = ConfigFileReader.ReadLabwareFromFile(nimbusCarrier.LabwareFileFullPath);
				Messenger.Default.Send<GenericMessage<Template>>(new GenericMessage<Template>(labware as Template), (object)"LoadThisTemplate");
				Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedTemplateViewModel>()), (object)"Navigation");
				Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"ResetNimbusFlexCarrierReferences");
				nimbusCarrier.DataChanged = false;
				nimbusCarrier = null;
				subVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<NimbusFlexCarrierPedestalSelectorViewModel>();
			}
			saveFileDialog = null;
		}
		catch (Exception ex)
		{
			string trimmedMessage = ex.InnerException.Message.TrimEnd(Environment.NewLine.ToCharArray());
			Application.Current.Dispatcher.BeginInvoke((Action)delegate
			{
				DialogWindowHelper.ShowDialogWithProportionalDimensions("", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogSimpleWarningViewModel>(), trimmedMessage, 0.45, 0.35);
			}, DispatcherPriority.Background, null);
		}
	}

	private bool CanExecuteRightButtonCommand()
	{
		if (rightButtonContent == "Continue")
		{
			return canContinue;
		}
		return saveAllowed;
	}

	private void ExecuteLoadModelJoiner()
	{
		if (modelJoinerWrapper == null)
		{
			ModelJoinerWrapper = new ModelJoinerWrapper();
		}
		Messenger.Default.Send<GenericMessage<Carrier>>(new GenericMessage<Carrier>((Carrier)nimbusCarrier), (object)"InitializeModelJoiner");
		Messenger.Default.Send<FlexCarrierMessage>(new FlexCarrierMessage(nimbusCarrier, availablePedestals), (object)"SetNimbusFlexCarrierReferences");
	}

	private void SetupModelJoiner(FlexCarrierMessage msg)
	{
		nimbusCarrier = msg.Carrier as NimbusCarrier;
		availablePedestals = msg.AvailablePedestals;
		rightButtonContent = "Continue";
		canContinue = false;
		base.ShowContinueTip = true;
	}

	private void UpdateCanContinue(bool newValue)
	{
		canContinue = newValue;
		if (canContinue)
		{
			base.ShowContinueTip = false;
		}
		else
		{
			base.ShowContinueTip = true;
		}
	}
}
