using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.ConfigFileWritingAndReading;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;
using Microsoft.Win32;

namespace HxLabwrEd2.ViewModel;

public class CreationRackContainerPropertiesViewModel : ViewModelBase
{
	private Rack _rack;

	private CreationViewModelBase _parentCreationViewModel;

	public Rack Rack
	{
		get
		{
			return _rack;
		}
		set
		{
			((ObservableObject)this).Set<Rack>((Expression<Func<Rack>>)(() => Rack), ref _rack, value);
		}
	}

	public CreationViewModelBase ParentCreationViewModel
	{
		get
		{
			return _parentCreationViewModel;
		}
		set
		{
			((ObservableObject)this).Set<CreationViewModelBase>((Expression<Func<CreationViewModelBase>>)(() => ParentCreationViewModel), ref _parentCreationViewModel, value);
		}
	}

	public RelayCommand FilePath { get; }

	public RelayCommand LaunchContainersDialog { get; }

	public RelayCommand NewContainer { get; }

	public CreationRackContainerPropertiesViewModel()
	{
		//IL_0088: Unknown result type (might be due to invalid IL or missing references)
		//IL_0092: Expected O, but got Unknown
		//IL_00a0: Unknown result type (might be due to invalid IL or missing references)
		//IL_00aa: Expected O, but got Unknown
		//IL_00b8: Unknown result type (might be due to invalid IL or missing references)
		//IL_00c2: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<Rack>>((object)this, (object)"DisplayThisRackContainerData", (Action<GenericMessage<Rack>>)delegate(GenericMessage<Rack> msg)
		{
			LoadRack(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisRackContainerData", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RedrawRackContainer", (Action<NotificationMessage>)delegate
		{
			_rack?.TriggerRedraw();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RackContainerUpdateSingleContainer", (Action<NotificationMessage>)delegate
		{
			UpdateSingleRackContainer();
		}, false);
		FilePath = new RelayCommand((Action)ExecuteFilePath, false);
		LaunchContainersDialog = new RelayCommand((Action)ExecuteLaunchContainersDialog, false);
		NewContainer = new RelayCommand((Action)ExecuteNewContainer, false);
	}

	private void LoadRack(Rack rack)
	{
		Rack = rack;
	}

	private void ResetReferences()
	{
		Rack = null;
	}

	private void UpdateSingleRackContainer()
	{
		if (_rack.ContainerLayout == ContainerLayout.SingleContainer)
		{
			RackHelper.UpdateSingleContainerRelativePath(_rack, null);
			_rack?.TriggerRedraw();
		}
	}

	private void ExecuteFilePath()
	{
		OpenFileDialog openFileDialog = new OpenFileDialog
		{
			Filter = "Container|*.ctr",
			InitialDirectory = HxRegHelper.LabwarePath
		};
		if (openFileDialog.ShowDialog() == true)
		{
			_rack.SingleRepeatingContainer.FilePath = openFileDialog.FileName;
			UpdateSingleRackContainer();
			Messenger.Default.Send<NotificationMessage>((NotificationMessage)null, (object)"RackContainerPathScroll");
		}
	}

	private void ExecuteLaunchContainersDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Custom Container Layout", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogRackContainersViewModel>(), _rack, 0.9, 0.8);
		if (flag.HasValue && flag == true)
		{
			ConfigFileReader.UpdateRackDrawContainers(_rack);
			_rack.TriggerRedraw();
		}
	}

	private void RefreshDelayedBindings()
	{
		//IL_0040: Unknown result type (might be due to invalid IL or missing references)
		//IL_004f: Expected O, but got Unknown
		_parentCreationViewModel.UnsubscribeToAllNeededPropertyChangedEvents();
		double x = _rack.SingleRepeatingContainer.Offsets.X;
		double y = _rack.SingleRepeatingContainer.Offsets.Y;
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"CreationRackContainerRefreshDelayedBindings");
		_parentCreationViewModel.SubscribeToAllNeededPropertyChangedEvents();
		if (x != _rack.SingleRepeatingContainer.Offsets.X || y != _rack.SingleRepeatingContainer.Offsets.Y)
		{
			_rack.UpdateRackWellsWithRepeatedContainerOffsets();
		}
	}

	private void ExecuteNewContainer()
	{
		RefreshDelayedBindings();
		RackNewContainerHelper.Start();
	}
}
