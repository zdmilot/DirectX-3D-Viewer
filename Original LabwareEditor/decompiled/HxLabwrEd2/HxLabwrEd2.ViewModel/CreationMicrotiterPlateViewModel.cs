using System;
using System.ComponentModel;
using System.Drawing;
using System.Text.RegularExpressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.CommandWpf;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class CreationMicrotiterPlateViewModel : CreationViewModelBase
{
	private RectangularRack rectangularRack;

	private readonly string firstSubVMTitle = "Choose/Edit Microtiter Plate Type and Properties";

	public CreationMicrotiterPlateViewModel()
	{
		//IL_001f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0029: Expected O, but got Unknown
		//IL_0037: Unknown result type (might be due to invalid IL or missing references)
		//IL_0041: Expected O, but got Unknown
		//IL_005b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0065: Expected O, but got Unknown
		base.GenerateVisuals = new RelayCommand((Action)ExecuteGenerateVisuals, false);
		base.LeftButtonCommand = new RelayCommand((Action)ExecuteLeftButtonCommand, false);
		base.RightButtonCommand = new RelayCommand((Action)ExecuteRightButtonCommand, (Func<bool>)CanExecuteRightButtonCommand, false);
		Messenger.Default.Register<GenericMessage<RectangularRack>>((object)this, (object)"CreateMicrotiterPlate", (Action<GenericMessage<RectangularRack>>)delegate(GenericMessage<RectangularRack> msg)
		{
			SetViewModelsRectangularRack(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<string>>((object)this, (object)"NewContainerCreationMicrotiterPlate", (Action<GenericMessage<string>>)delegate(GenericMessage<string> msg)
		{
			SetNewContainer(msg.Content);
		}, false);
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationMicrotiterPlatePropertiesViewModel>();
		SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
		base.Labware2DViewDisplayVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<Labware2DViewModel>();
	}

	~CreationMicrotiterPlateViewModel()
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

	public void SetViewModelsRectangularRack(RectangularRack rectangularRack)
	{
		this.rectangularRack = rectangularRack;
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = firstSubVMTitle;
		canContinue = false;
		base.ShowContinueTip = true;
	}

	private void ExecuteGenerateVisuals()
	{
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"Clear2DDrawing");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)rectangularRack), (object)"Draw2DLabware");
		Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(rectangularRack), (object)"DisplayThisMicrotiterPlate");
		Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)rectangularRack), (object)"LoadGeneralProperties");
		((ObservableObject)rectangularRack).PropertyChanged += RectangularRack_PropertyChanged;
	}

	public void SetNewContainer(string fullContainerPath)
	{
		rectangularRack.SingleRepeatingContainer.FilePath = fullContainerPath;
		RackHelper.UpdateSingleContainerRelativePath(rectangularRack, null);
		rectangularRack.TriggerRedraw();
		Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"MicrotiterPlateContainerPathScroll");
	}

	private void ExecuteLeftButtonCommand()
	{
		if (base.RightButtonContent == "Continue")
		{
			((ObservableObject)rectangularRack).PropertyChanged -= RectangularRack_PropertyChanged;
			rectangularRack = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisMicrotiterPlate");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<NewLabwareViewModel>()), (object)"Navigation");
			return;
		}
		base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationMicrotiterPlatePropertiesViewModel>();
		base.RightButtonContent = "Continue";
		base.SubVMTitleBarContent = firstSubVMTitle;
		rectangularRack.Name = "";
		rectangularRack.Description = "";
		rectangularRack.Bitmap = "";
		rectangularRack.Image = "";
		rectangularRack.Model = "";
		rectangularRack.ModelOffsets.X = 0.0;
		rectangularRack.ModelOffsets.Y = 0.0;
		rectangularRack.ModelOffsets.Z = 0.0;
		rectangularRack.Visible = true;
		rectangularRack.BackgroundColor = Color.FromArgb(0, 255, 255, 255);
	}

	private void ExecuteRightButtonCommand()
	{
		//IL_001c: Unknown result type (might be due to invalid IL or missing references)
		//IL_002b: Expected O, but got Unknown
		if (base.RightButtonContent == "Continue")
		{
			Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"MicrotiterCreationRefreshDelayedBindings");
			if (!string.IsNullOrEmpty(rectangularRack.SingleRepeatingContainer.FilePath))
			{
				base.SubVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedGeneralPropertiesViewModel>();
				base.RightButtonContent = "Save";
				base.SubVMTitleBarContent = "General Properties";
			}
			return;
		}
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.Filter = "Rectangular Rack (*.rck)|*.rck";
		saveFileDialog.InitialDirectory = Environment.CurrentDirectory;
		saveFileDialog.FileName = ((!string.IsNullOrWhiteSpace(rectangularRack.Name)) ? rectangularRack.Name : "");
		if (saveFileDialog.ShowDialog() == true)
		{
			string text = saveFileDialog.FileName;
			string pattern = "^.*\\.(rck|RCK)$";
			if (!Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase))
			{
				text += ".rck";
			}
			rectangularRack.LabwareFileFullPath = text;
			((ObservableObject)rectangularRack).PropertyChanged -= RectangularRack_PropertyChanged;
			RackContainer singleRepeatingContainer = new RackContainer(rectangularRack.SingleRepeatingContainer);
			RackHelper.UpdateSingleContainerFilePath(rectangularRack);
			RackHelper.UpdateSingleContainerRelativePath(rectangularRack, null);
			if (!ConfigFileWriter.Save(rectangularRack, clearAuditHistory: true))
			{
				rectangularRack.SingleRepeatingContainer = singleRepeatingContainer;
				((ObservableObject)rectangularRack).PropertyChanged += RectangularRack_PropertyChanged;
				return;
			}
			Labware labware = ConfigFileReader.ReadLabwareFromFile(rectangularRack.LabwareFileFullPath);
			Messenger.Default.Send<GenericMessage<RectangularRack>>(new GenericMessage<RectangularRack>(labware as RectangularRack), (object)"LoadThisRectangularRack");
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<LoadedRectangularRackViewModel>()), (object)"Navigation");
			labware = null;
			rectangularRack = null;
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"UnloadThisMicrotiterPlate");
			subVM = (ViewModelBase)(object)SimpleIoc.Default.GetInstance<CreationMicrotiterPlatePropertiesViewModel>();
		}
		saveFileDialog = null;
	}

	private bool CanExecuteRightButtonCommand()
	{
		if (rightButtonContent == "Continue")
		{
			return canContinue;
		}
		return saveAllowed;
	}

	private void RectangularRack_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "FilePath")
		{
			RackHelper.UpdateSingleContainerRelativePath(rectangularRack, null);
			rectangularRack.TriggerRedraw();
			if (!string.IsNullOrWhiteSpace(rectangularRack.SingleRepeatingContainer.FilePath) && rectangularRack.DrawContainers != null && rectangularRack.DrawContainers.ContainsKey(rectangularRack.SingleRepeatingContainer.RelativeFilePath) && rectangularRack.DrawContainers[rectangularRack.SingleRepeatingContainer.RelativeFilePath].Status != AssignedLabwareStatus.NotFound)
			{
				canContinue = true;
				base.ShowContinueTip = false;
			}
			else
			{
				canContinue = false;
				base.ShowContinueTip = true;
			}
			base.RightButtonCommand.RaiseCanExecuteChanged();
		}
		else if (e.PropertyName == "WellPattern" || e.PropertyName == "Orientation" || e.PropertyName == "BackgroundColor")
		{
			rectangularRack.TriggerRedraw();
		}
		else if (e.PropertyName == "Redraw")
		{
			Messenger.Default.Send<GenericMessage<Labware>>(new GenericMessage<Labware>((Labware)rectangularRack), (object)"Draw2DLabware");
		}
	}
}
