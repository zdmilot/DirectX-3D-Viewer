using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using GongSolutions.Wpf.DragDrop;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class DialogContainerSegmentsViewModel : DialogViewModelBase, IDropTarget
{
	private TrulyObservableCollection<ContainerSegment> containerSegmentsUI;

	private Container loadedContainer;

	private bool isListDirty;

	private bool isReadOnly;

	private Dictionary<ContainerSegment, int> controlsWithErrors;

	public TrulyObservableCollection<ContainerSegment> ContainerSegmentsUI
	{
		get
		{
			return containerSegmentsUI;
		}
		set
		{
			if (containerSegmentsUI != null)
			{
				containerSegmentsUI.CollectionChanged -= ContainerSegmentsUICollectionChanged;
			}
			((ObservableObject)this).Set<TrulyObservableCollection<ContainerSegment>>((Expression<Func<TrulyObservableCollection<ContainerSegment>>>)(() => ContainerSegmentsUI), ref containerSegmentsUI, value);
			if (containerSegmentsUI != null)
			{
				containerSegmentsUI.CollectionChanged += ContainerSegmentsUICollectionChanged;
			}
		}
	}

	public bool IsListDirty
	{
		get
		{
			return isListDirty;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsListDirty), ref isListDirty, value);
		}
	}

	public bool IsReadOnly
	{
		get
		{
			return isReadOnly;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => IsReadOnly), ref isReadOnly, value);
		}
	}

	public RelayCommand<Shape> AddStandardSegment { get; }

	public RelayCommand<Shape> AddBaseSegment { get; }

	public RelayCommand<ContainerSegment> DeleteSegment { get; }

	public DialogContainerSegmentsViewModel()
	{
		//IL_0020: Unknown result type (might be due to invalid IL or missing references)
		//IL_002a: Expected O, but got Unknown
		//IL_0038: Unknown result type (might be due to invalid IL or missing references)
		//IL_0042: Expected O, but got Unknown
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, (Func<bool>)CanExecuteSaveButton, false);
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		AddStandardSegment = new RelayCommand<Shape>((Action<Shape>)delegate(Shape shape)
		{
			ExecuteAddStandardSegment(shape);
		}, (Func<Shape, bool>)((Shape shape) => CanExecuteAddStandardSegment(shape)), false);
		AddBaseSegment = new RelayCommand<Shape>((Action<Shape>)delegate(Shape shape)
		{
			ExecuteAddBaseSegment(shape);
		}, (Func<Shape, bool>)((Shape shape) => CanExecuteAddBaseSegment(shape)), false);
		DeleteSegment = new RelayCommand<ContainerSegment>((Action<ContainerSegment>)delegate(ContainerSegment segment)
		{
			ExecuteDeleteSegment(segment);
		}, false);
		ContainerSegmentsUI = new TrulyObservableCollection<ContainerSegment>();
		Messenger.Default.Register<GenericMessage<Container>>((object)this, (object)"DialogContainerSegmentsSetup", (Action<GenericMessage<Container>>)delegate(GenericMessage<Container> msg)
		{
			SetupLoadedContainer(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<ValidationErrorEventArgs>>((object)this, (object)"DialogSegmentError", (Action<GenericMessage<ValidationErrorEventArgs>>)delegate(GenericMessage<ValidationErrorEventArgs> msg)
		{
			HandleSegmentError(msg.Content);
		}, false);
		Messenger.Default.Register<GenericMessage<ContainerSegment>>((object)this, (object)"DraggedSegment", (Action<GenericMessage<ContainerSegment>>)delegate(GenericMessage<ContainerSegment> msg)
		{
			ClearDraggedSegmentsErros(msg.Content);
		}, false);
	}

	private void ExecuteSaveButton()
	{
		foreach (ContainerSegment item in ContainerSegmentsUI)
		{
			if ((item.Shape == Shape.VCone || item.Shape == Shape.InvertedVCone) && item.Dx == item.Dy)
			{
				item.Dz = item.Dx;
				item.Dx = 0.0;
				item.Dy = 0.0;
				item.Shape = Shape.Cylinder;
			}
			if (item.Shape == Shape.InvertedVCone && item.Dx > item.Dy)
			{
				item.Shape = Shape.VCone;
			}
		}
		ContainerSegment.RecalculateMinMaxHeights(ContainerSegmentsUI);
		foreach (ContainerSegment item2 in ContainerSegmentsUI)
		{
			item2.RecalculateHeightAndVolume();
		}
		loadedContainer.Segments = ContainerSegmentsUI;
		ContainerSegmentsUI = null;
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		loadedContainer = null;
	}

	private bool CanExecuteSaveButton()
	{
		if (IsListDirty && ContainerSegmentsUI != null && ContainerSegmentsUI.Count > 0 && controlsWithErrors != null && controlsWithErrors.Count == 0)
		{
			return true;
		}
		return false;
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		loadedContainer = null;
	}

	private void ExecuteAddStandardSegment(Shape shape)
	{
		ContainerSegment baseSegment = GetBaseSegment();
		if (baseSegment == null || ContainerSegmentsUI.IndexOf(baseSegment) != ContainerSegmentsUI.Count - 1)
		{
			if (shape == Shape.Cylinder)
			{
				ContainerSegmentsUI.Add(new ContainerSegment(Shape.Cylinder));
			}
			if (shape == Shape.VCone || shape == Shape.InvertedVCone)
			{
				ContainerSegmentsUI.Add(new ContainerSegment(Shape.InvertedVCone));
			}
			if (shape == Shape.Rectangle)
			{
				ContainerSegmentsUI.Add(new ContainerSegment(Shape.Rectangle));
			}
		}
		else
		{
			if (shape == Shape.Cylinder)
			{
				ContainerSegmentsUI.Insert(ContainerSegmentsUI.Count - 1, new ContainerSegment(Shape.Cylinder));
			}
			if (shape == Shape.VCone || shape == Shape.InvertedVCone)
			{
				ContainerSegmentsUI.Insert(ContainerSegmentsUI.Count - 1, new ContainerSegment(Shape.InvertedVCone));
			}
			if (shape == Shape.Rectangle)
			{
				ContainerSegmentsUI.Insert(ContainerSegmentsUI.Count - 1, new ContainerSegment(Shape.Rectangle));
			}
		}
	}

	private void ExecuteAddBaseSegment(Shape shape)
	{
		if (shape == Shape.VConeBase)
		{
			ContainerSegmentsUI.Add(new ContainerSegment(Shape.VConeBase));
		}
		if (shape == Shape.RoundBase)
		{
			ContainerSegmentsUI.Add(new ContainerSegment(Shape.RoundBase));
		}
	}

	private void ExecuteDeleteSegment(ContainerSegment segment)
	{
		if (controlsWithErrors.ContainsKey(segment))
		{
			controlsWithErrors.Remove(segment);
		}
		containerSegmentsUI.Remove(segment);
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private bool CanExecuteAddStandardSegment(Shape shape)
	{
		if (loadedContainer == null || ContainerSegmentsUI == null)
		{
			return false;
		}
		if (isReadOnly)
		{
			return false;
		}
		if (ContainerSegmentsUI.Count >= 5)
		{
			return false;
		}
		return true;
	}

	private bool CanExecuteAddBaseSegment(Shape shape)
	{
		if (loadedContainer == null || ContainerSegmentsUI == null)
		{
			return false;
		}
		if (isReadOnly)
		{
			return false;
		}
		if (ContainerSegmentsUI.Count >= 5)
		{
			return false;
		}
		foreach (ContainerSegment item in containerSegmentsUI)
		{
			if (item.Shape == Shape.RoundBase || item.Shape == Shape.VConeBase)
			{
				return false;
			}
		}
		return true;
	}

	private void SetupLoadedContainer(Container loadedContainer)
	{
		this.loadedContainer = loadedContainer;
		IsReadOnly = loadedContainer.ReadOnly;
		controlsWithErrors = new Dictionary<ContainerSegment, int>();
		ContainerSegmentsUI = new TrulyObservableCollection<ContainerSegment>();
		foreach (ContainerSegment segment in loadedContainer.Segments)
		{
			ContainerSegmentsUI.Add(new ContainerSegment(segment));
		}
		IsListDirty = false;
	}

	public void DragOver(IDropInfo dropInfo)
	{
		ContainerSegment containerSegment = dropInfo.Data as ContainerSegment;
		if (containerSegment.Shape == Shape.RoundBase || containerSegment.Shape == Shape.VConeBase)
		{
			if (ContainerSegmentsUI[ContainerSegmentsUI.Count - 1] == containerSegment)
			{
				dropInfo.Effects = DragDropEffects.None;
				return;
			}
			dropInfo.DropTargetAdorner = DropTargetAdorners.Insert;
			dropInfo.Effects = DragDropEffects.Move;
			return;
		}
		ContainerSegment baseSegment = GetBaseSegment();
		if (baseSegment == null)
		{
			dropInfo.DropTargetAdorner = DropTargetAdorners.Insert;
			dropInfo.Effects = DragDropEffects.Move;
		}
		else if (baseSegment != null && ContainerSegmentsUI.IndexOf(baseSegment) == containerSegmentsUI.Count - 1)
		{
			if (dropInfo.InsertIndex >= ContainerSegmentsUI.Count)
			{
				dropInfo.Effects = DragDropEffects.None;
				return;
			}
			dropInfo.DropTargetAdorner = DropTargetAdorners.Insert;
			dropInfo.Effects = DragDropEffects.Move;
		}
		else
		{
			dropInfo.DropTargetAdorner = DropTargetAdorners.Insert;
			dropInfo.Effects = DragDropEffects.Move;
		}
	}

	public void Drop(IDropInfo dropInfo)
	{
		ContainerSegment containerSegment = dropInfo.Data as ContainerSegment;
		if (dropInfo.InsertIndex != ContainerSegmentsUI.IndexOf(containerSegment) && dropInfo.InsertIndex - 1 != ContainerSegmentsUI.IndexOf(containerSegment))
		{
			if (dropInfo.InsertIndex > ContainerSegmentsUI.IndexOf(containerSegment))
			{
				ContainerSegmentsUI.Move(containerSegmentsUI.IndexOf(containerSegment), dropInfo.InsertIndex - 1);
			}
			else
			{
				ContainerSegmentsUI.Move(containerSegmentsUI.IndexOf(containerSegment), dropInfo.InsertIndex);
			}
			ClearDraggedSegmentsErros(containerSegment);
		}
	}

	private void HandleSegmentError(ValidationErrorEventArgs e)
	{
		ContainerSegment key = (e.OriginalSource as Control).DataContext as ContainerSegment;
		if (e.Action == ValidationErrorEventAction.Added)
		{
			if (controlsWithErrors.ContainsKey(key))
			{
				controlsWithErrors[key]++;
			}
			else
			{
				controlsWithErrors.Add(key, 1);
			}
		}
		else
		{
			controlsWithErrors[key]--;
			if (controlsWithErrors[key] == 0)
			{
				controlsWithErrors.Remove(key);
			}
		}
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void ContainerSegmentsUICollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
	{
		IsListDirty = true;
		base.SaveButton.RaiseCanExecuteChanged();
		AddStandardSegment.RaiseCanExecuteChanged();
		AddBaseSegment.RaiseCanExecuteChanged();
		((ObservableObject)this).RaisePropertyChanged((string)null);
	}

	private void ClearDraggedSegmentsErros(ContainerSegment segment)
	{
		if (controlsWithErrors.ContainsKey(segment))
		{
			controlsWithErrors.Remove(segment);
		}
	}

	private ContainerSegment GetBaseSegment()
	{
		if (ContainerSegmentsUI != null)
		{
			foreach (ContainerSegment item in ContainerSegmentsUI)
			{
				if (item.Shape == Shape.RoundBase || item.Shape == Shape.VConeBase)
				{
					return item;
				}
			}
		}
		return null;
	}
}
