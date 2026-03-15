using System;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class LoadedContainerPropertiesViewModel : ViewModelBase
{
	private string segmentButtonText;

	private HxLabwrEd2.Model.Container loadedContainer;

	public RelayCommand LaunchSegmentsDialog { get; }

	public string SegmentButtonText
	{
		get
		{
			return segmentButtonText;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SegmentButtonText), ref segmentButtonText, value);
		}
	}

	public HxLabwrEd2.Model.Container LoadedContainer
	{
		get
		{
			return loadedContainer;
		}
		set
		{
			if (loadedContainer != null)
			{
				((ObservableObject)loadedContainer).PropertyChanged -= LoadedContainer_PropertyChanged;
			}
			((ObservableObject)this).Set<HxLabwrEd2.Model.Container>((Expression<Func<HxLabwrEd2.Model.Container>>)(() => LoadedContainer), ref loadedContainer, value);
			if (loadedContainer != null)
			{
				((ObservableObject)loadedContainer).PropertyChanged += LoadedContainer_PropertyChanged;
			}
		}
	}

	public LoadedContainerPropertiesViewModel()
	{
		//IL_004e: Unknown result type (might be due to invalid IL or missing references)
		//IL_0058: Expected O, but got Unknown
		Messenger.Default.Register<GenericMessage<HxLabwrEd2.Model.Container>>((object)this, (object)"DisplayThisContainer", (Action<GenericMessage<HxLabwrEd2.Model.Container>>)delegate(GenericMessage<HxLabwrEd2.Model.Container> msg)
		{
			LoadContainer(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"UnloadThisContainer", (Action<NotificationMessage>)delegate
		{
			ResetReferences();
		}, false);
		LaunchSegmentsDialog = new RelayCommand((Action)ExecuteLaunchSegmentsDialog, false);
	}

	private void LoadContainer(HxLabwrEd2.Model.Container loadedContainer)
	{
		LoadedContainer = loadedContainer;
		UpdateDialogButtonText();
	}

	private void ResetReferences()
	{
		LoadedContainer = null;
	}

	private void ExecuteLaunchSegmentsDialog()
	{
		bool? flag = DialogWindowHelper.ShowDialogWithProportionalDimensions("Container Segments", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogContainerSegmentsViewModel>(), loadedContainer, 0.55, 0.98);
		if (!flag.HasValue || flag != true)
		{
			return;
		}
		UpdateDialogButtonText();
		double num = 0.0;
		foreach (ContainerSegment segment in loadedContainer.Segments)
		{
			num += segment.Height;
		}
		num += 2.0;
		loadedContainer.Clearance = num;
		loadedContainer.TriggerRedraw();
	}

	private void UpdateDialogButtonText()
	{
		if (loadedContainer != null)
		{
			if (loadedContainer.Segments.Count == 0)
			{
				SegmentButtonText = "Add Segments";
			}
			else
			{
				SegmentButtonText = (LoadedContainer.ReadOnly ? "View Segments" : "Edit Segments");
			}
		}
	}

	private void LoadedContainer_PropertyChanged(object sender, PropertyChangedEventArgs e)
	{
		if (e.PropertyName == "ReadOnly")
		{
			UpdateDialogButtonText();
		}
	}
}
