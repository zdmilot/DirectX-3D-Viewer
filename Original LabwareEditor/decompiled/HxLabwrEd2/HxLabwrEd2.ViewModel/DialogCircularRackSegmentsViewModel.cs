using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Linq;
using System.Linq.Expressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
using System.Windows.Shapes;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.CustomControls;
using HxLabwrEd2.CustomControls.RackDrawing;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Extensions;
using HxLabwrEd2.Model;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class DialogCircularRackSegmentsViewModel : DialogViewModelBase
{
	public static readonly Brush WellDefaultBrush = new SolidColorBrush(Color.FromRgb(byte.MaxValue, byte.MaxValue, byte.MaxValue));

	public static readonly Brush StartingWellBrush = new SolidColorBrush(Color.FromRgb(122, 193, 66));

	public static readonly Brush EndingWellBrush = new SolidColorBrush(Color.FromRgb(225, 0, 125));

	public static readonly Brush IntermediateWellBrush = new SolidColorBrush(Color.FromRgb(25, 140, 225));

	public static readonly Brush SelectionCircleBrush = new SolidColorBrush(Color.FromRgb(25, 140, 225));

	public static readonly Brush SelectionCircleFillBrush = new SolidColorBrush(Color.FromRgb(byte.MaxValue, byte.MaxValue, byte.MaxValue))
	{
		Opacity = 100.0
	};

	private CircularRack _circularRackDuplicate;

	private CircularRack _loadedCircularRack;

	private UIElement _frontBuffer;

	private List<UIElement> _drawingElements;

	private List<List<ContentControl>> _segmentRackWellHosts;

	private SegmentSettings _selectedSegmentSettingsItem;

	private RelayCommand _addSegmentCommand;

	private RelayCommand _removeSegmentCommand;

	private RelayCommand _refreshCommand;

	private ObservableCollection<SegmentSettings> _segmentSettings;

	private readonly Canvas _backBuffer;

	private double _rackWellRadius;

	private ObservableCollectionPropertyChangedListener<SegmentSettings> _settingsListener;

	private bool ignoreSelectionUpdate;

	private const int MaxNumberOfSegments = 20;

	private const int BoundingBoxIndex = 0;

	private const int SelectionCircleIndex = 1;

	private const double BorderThicknessFactor = 0.0015;

	public string SegmentCountText => $"{SegmentSettings.Count}/{20} Segments";

	public ObservableCollection<SegmentSettings> SegmentSettings
	{
		get
		{
			return _segmentSettings;
		}
		set
		{
			((ObservableObject)this).Set<ObservableCollection<SegmentSettings>>((Expression<Func<ObservableCollection<SegmentSettings>>>)(() => SegmentSettings), ref _segmentSettings, value);
		}
	}

	public RelayCommand AddSegmentCommand
	{
		get
		{
			return _addSegmentCommand;
		}
		set
		{
			((ObservableObject)this).Set<RelayCommand>((Expression<Func<RelayCommand>>)(() => AddSegmentCommand), ref _addSegmentCommand, value);
		}
	}

	public RelayCommand RefreshCommand
	{
		get
		{
			return _refreshCommand;
		}
		set
		{
			((ObservableObject)this).Set<RelayCommand>((Expression<Func<RelayCommand>>)(() => RefreshCommand), ref _refreshCommand, value);
		}
	}

	public RelayCommand RemoveSegmentCommand
	{
		get
		{
			return _removeSegmentCommand;
		}
		set
		{
			((ObservableObject)this).Set<RelayCommand>((Expression<Func<RelayCommand>>)(() => RemoveSegmentCommand), ref _removeSegmentCommand, value);
		}
	}

	public SegmentSettings SelectedSegmentSettingsItem
	{
		get
		{
			return _selectedSegmentSettingsItem;
		}
		set
		{
			if (((ObservableObject)this).Set<SegmentSettings>((Expression<Func<SegmentSettings>>)(() => SelectedSegmentSettingsItem), ref _selectedSegmentSettingsItem, value) && !ignoreSelectionUpdate)
			{
				RefreshDrawing();
			}
		}
	}

	public CircularRack CircularRackDuplicate
	{
		get
		{
			return _circularRackDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<CircularRack>((Expression<Func<CircularRack>>)(() => CircularRackDuplicate), ref _circularRackDuplicate, value);
		}
	}

	public UIElement FrontBuffer
	{
		get
		{
			return _frontBuffer;
		}
		set
		{
			((ObservableObject)this).Set<UIElement>((Expression<Func<UIElement>>)(() => FrontBuffer), ref _frontBuffer, value);
		}
	}

	private bool SegmentExists
	{
		get
		{
			if (CircularRackDuplicate != null)
			{
				return CircularRackDuplicate.Segments.Any();
			}
			return false;
		}
	}

	public DialogCircularRackSegmentsViewModel()
	{
		//IL_0021: Unknown result type (might be due to invalid IL or missing references)
		//IL_002b: Expected O, but got Unknown
		//IL_0045: Unknown result type (might be due to invalid IL or missing references)
		//IL_004f: Expected O, but got Unknown
		//IL_0069: Unknown result type (might be due to invalid IL or missing references)
		//IL_0073: Expected O, but got Unknown
		//IL_0081: Unknown result type (might be due to invalid IL or missing references)
		//IL_008b: Expected O, but got Unknown
		if (!DesignerProperties.GetIsInDesignMode(new DependencyObject()))
		{
			base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
			base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, (Func<bool>)CanExecuteSaveCommand, false);
			AddSegmentCommand = new RelayCommand((Action)ExecuteAddSegmentCommand, (Func<bool>)CanExecuteAddSegmentCommand, false);
			RemoveSegmentCommand = new RelayCommand((Action)ExecuteRemoveSegmentCommand, false);
			_backBuffer = new Canvas();
			_drawingElements = new List<UIElement>();
			_segmentRackWellHosts = new List<List<ContentControl>>();
			Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogCircularRackSegmentsSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
			{
				SetupLoadedLabware(msg.Content);
			}, false);
		}
	}

	~DialogCircularRackSegmentsViewModel()
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

	private bool CanExecuteSaveCommand()
	{
		if (CircularRackDuplicate.DataChanged)
		{
			return CircularRackDuplicate.Segments.Any();
		}
		return false;
	}

	private void InitializeSegmentSettingsCollection(CircularRack circularRack)
	{
		CircularRackDuplicate = new CircularRack(circularRack);
		SegmentSettings = new ObservableCollection<SegmentSettings>();
		foreach (CircularRackSegment segment in CircularRackDuplicate.Segments)
		{
			SegmentSettings.Add(new SegmentSettings
			{
				StartingAngle = AngleConverter.ConvertGeometricAngleToClockAngle(segment.Arc.RelativeStartPoint.CounterClockwiseAngle).Degrees,
				Radius = segment.Arc.Radius,
				ClockwiseArcAngle = segment.Arc.ClockwiseAngle.Degrees,
				NumberOfWells = segment.HoleCount
			});
		}
	}

	private void UpdateCircularRackSegments()
	{
		Vector2 center = (CircularRackDuplicate.Segments.Any() ? CircularRackDuplicate.Segments.First().Arc.CenterPoint : Vector2.Zero());
		CircularRackDuplicate.Segments.Clear();
		SegmentSettings.Each(delegate(SegmentSettings settings, int settingIndex)
		{
			Angle angle = AngleConverter.ConvertClockAngleToGeometricAngle(Angle.FromDegrees(settings.StartingAngle));
			Angle angle2 = Angle.FullCircle() - Angle.FromDegrees(settings.ClockwiseArcAngle);
			CircularRackDuplicate.Segments.Add(new CircularRackSegment
			{
				Arc = Arc.FromRelativePointAndCounterClockwiseAngle(Vector2.FromPolar(angle, settings.Radius), angle2, center),
				HoleCount = settings.NumberOfWells
			});
		});
		CircularRackDuplicate.TranslateReferencePointToOrigin();
		CircularRackDuplicate.RegenerateRackWells();
	}

	private void SetupLoadedLabware(Labware loadedLabware)
	{
		_loadedCircularRack = loadedLabware as CircularRack;
		InitializeSegmentSettingsCollection(_loadedCircularRack);
		_settingsListener = ObservableCollectionPropertyChangedListener.Create<SegmentSettings>(SegmentSettings, "");
		_settingsListener.PropertyChanged += delegate
		{
			RefreshAll();
		};
		SegmentSettings.CollectionChanged += delegate(object sender, NotifyCollectionChangedEventArgs args)
		{
			if (args.Action == NotifyCollectionChangedAction.Add)
			{
				ignoreSelectionUpdate = true;
				SelectedSegmentSettingsItem = SegmentSettings.Last();
				ignoreSelectionUpdate = false;
				RefreshAll();
				((ObservableObject)this).RaisePropertyChanged("SegmentCountText");
			}
			else if (args.Action == NotifyCollectionChangedAction.Remove)
			{
				List<ContentControl> list = _segmentRackWellHosts[args.OldStartingIndex];
				list.ForEach(_backBuffer.Children.Remove);
				_segmentRackWellHosts.Remove(list);
				RefreshAll();
				((ObservableObject)this).RaisePropertyChanged("SegmentCountText");
			}
		};
		if (SegmentExists)
		{
			SelectedSegmentSettingsItem = SegmentSettings.First();
			_circularRackDuplicate.DataChanged = false;
		}
	}

	private void RefreshAll()
	{
		AddSegmentCommand.RaiseCanExecuteChanged();
		RemoveSegmentCommand.RaiseCanExecuteChanged();
		UpdateCircularRackSegments();
		RefreshDrawing();
		CircularRackDuplicate.DataChanged = true;
		base.SaveButton.RaiseCanExecuteChanged();
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		CleanUpReferencesAndData();
	}

	private void ExecuteSaveButton()
	{
		_loadedCircularRack.Segments.Clear();
		CircularRackDuplicate.Segments.ToList().ForEach(delegate(CircularRackSegment segment)
		{
			_loadedCircularRack.Segments.Add(new CircularRackSegment(segment));
		});
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		CleanUpReferencesAndData();
	}

	private void CleanUpReferencesAndData()
	{
		_loadedCircularRack = null;
		CircularRackDuplicate = null;
		SegmentSettings = null;
		_settingsListener = null;
		_segmentRackWellHosts.Clear();
		_drawingElements.Clear();
		_backBuffer.Children.Clear();
		FrontBuffer = null;
	}

	private bool CanExecuteAddSegmentCommand()
	{
		return SegmentSettings.Count < 20;
	}

	private void ExecuteAddSegmentCommand()
	{
		SegmentSettings segmentSettings = new SegmentSettings();
		if (SegmentSettings.Any())
		{
			segmentSettings = new SegmentSettings(SegmentSettings.Aggregate((SegmentSettings agg, SegmentSettings next) => (!(next.Radius > agg.Radius)) ? agg : next));
			segmentSettings.Radius += 20.0;
		}
		SegmentSettings.Add(segmentSettings);
	}

	private void ExecuteRemoveSegmentCommand()
	{
		SegmentSettings.Remove(_selectedSegmentSettingsItem);
	}

	private void UpdateRackWellDrawingFill(int segmentIndex, int rackWellIndex, ShapeUI rackWellDrawing, int numberOfWellsInSegment)
	{
		if (segmentIndex == SegmentSettings.IndexOf(_selectedSegmentSettingsItem))
		{
			bool flag = CircularRackDuplicate.CircularDefaultSequence.IncrementDirection == ArcAngleDirection.Clockwise;
			if (rackWellIndex == 0)
			{
				rackWellDrawing.Fill = (flag ? StartingWellBrush : EndingWellBrush);
			}
			if (rackWellIndex == numberOfWellsInSegment - 1)
			{
				rackWellDrawing.Fill = (flag ? EndingWellBrush : StartingWellBrush);
			}
			if (rackWellIndex > 0 && rackWellIndex < numberOfWellsInSegment - 1)
			{
				rackWellDrawing.Fill = IntermediateWellBrush;
			}
		}
		else
		{
			rackWellDrawing.Fill = WellDefaultBrush;
		}
	}

	private void AddRackWellDrawingToCacheIfMissing(IReadOnlyCollection<UIElement> currentSegmentRackWellHosts, int rackWellIndex, RackWell rackWell, int segmentIndex)
	{
		if (currentSegmentRackWellHosts.ElementAtOrDefault(rackWellIndex) == null)
		{
			CircularWellViewModel content = new CircularWellViewModel(0.0)
			{
				Fill = WellDefaultBrush
			};
			ContentControl contentControl = new ContentControl
			{
				Content = content
			};
			ToolTipService.SetBetweenShowDelay(contentControl, 0);
			ToolTipService.SetInitialShowDelay(contentControl, 250);
			ToolTipService.SetShowDuration(contentControl, 30000);
			ToolTipService.SetPlacement(contentControl, PlacementMode.MousePoint);
			_segmentRackWellHosts[segmentIndex].Add(contentControl);
			_backBuffer.Children.Add(contentControl);
		}
		ToolTipService.SetToolTip((ContentControl)currentSegmentRackWellHosts.ElementAt(rackWellIndex), $"  X: {Math.Round(rackWell.Center.X, 2, MidpointRounding.AwayFromZero)} mm\n  Y: {Math.Round(rackWell.Center.Y, 2, MidpointRounding.AwayFromZero)} mm");
	}

	private void RefreshBoundingBox(double largestRadius)
	{
		if (_selectedSegmentSettingsItem != null)
		{
			if (_drawingElements.ElementAtOrDefault(0) == null)
			{
				Rectangle rectangle = new Rectangle();
				_drawingElements.Insert(0, rectangle);
				_backBuffer.Children.Add(rectangle);
			}
			double num = 2.0 * largestRadius;
			Rectangle obj = (Rectangle)_drawingElements.ElementAt(0);
			obj.Width = num;
			obj.Height = num;
			obj.Opacity = 100.0;
			CanvasHelper.PositionElementOnCanvas(_drawingElements.ElementAt(0), Vector2.Zero());
		}
	}

	private void RefreshSelectionCircle(double largestRadius)
	{
		if (_selectedSegmentSettingsItem != null)
		{
			if (_drawingElements.ElementAtOrDefault(1) == null)
			{
				Ellipse ellipse = new Ellipse();
				_drawingElements.Insert(1, ellipse);
				_backBuffer.Children.Add(ellipse);
			}
			double num = 2.0 * _selectedSegmentSettingsItem.Radius;
			Ellipse obj = (Ellipse)_drawingElements.ElementAt(1);
			obj.Width = num;
			obj.Height = num;
			obj.Stroke = SelectionCircleBrush;
			obj.Fill = SelectionCircleFillBrush;
			obj.Opacity = 50.0;
			double num2 = largestRadius - _selectedSegmentSettingsItem.Radius;
			CanvasHelper.PositionElementOnCanvas(_drawingElements.ElementAt(1), Vector2.FromRectangular(num2, num2));
		}
	}

	private void RefreshRackWells(double largestRadius)
	{
		if (_selectedSegmentSettingsItem == null)
		{
			return;
		}
		CircularRackDuplicate.Segments.Each(delegate(CircularRackSegment segment, int segmentIndex)
		{
			if (_segmentRackWellHosts.ElementAtOrDefault(segmentIndex) == null)
			{
				_segmentRackWellHosts.Insert(segmentIndex, new List<ContentControl>());
			}
			List<ContentControl> rackWellHosts = _segmentRackWellHosts[segmentIndex];
			if (rackWellHosts.Count > segment.HoleCount)
			{
				rackWellHosts.ToList().ForEach(_backBuffer.Children.Remove);
				rackWellHosts.Clear();
			}
			CircularRackDuplicate.CorrespondingRackWells(segment).Each(delegate(RackWell rackWell, int rackWellIndex)
			{
				AddRackWellDrawingToCacheIfMissing(rackWellHosts, rackWellIndex, rackWell, segmentIndex);
				UpdateRackWellDrawingFill(segmentIndex, rackWellIndex, RetrieveRackWellDrawingFromHost(rackWellHosts, rackWellIndex), segment.HoleCount);
				Vector2 position = _circularRackDuplicate.RelativeReferencePoint() + Vector2.FromRectangular(largestRadius, largestRadius) + rackWell.Center - Vector2.FromRectangular(_rackWellRadius, _rackWellRadius);
				ContentControl contentControl = rackWellHosts[rackWellIndex];
				contentControl.Width = _rackWellRadius * 2.0;
				contentControl.Height = _rackWellRadius * 2.0;
				((CircularWellViewModel)contentControl.Content).Diameter = _rackWellRadius;
				CanvasHelper.PositionElementOnCanvas(contentControl, position);
			});
		});
	}

	private void RefreshDrawing()
	{
		if (!SegmentExists)
		{
			if (_drawingElements.ElementAtOrDefault(1) != null)
			{
				_drawingElements[1].Opacity = 0.0;
			}
			return;
		}
		_rackWellRadius = CircularRackDuplicate.LargestRadius * 0.05;
		double largestRadius = CircularRackDuplicate.LargestRadius + _rackWellRadius * 2.0;
		RefreshBoundingBox(largestRadius);
		RefreshSelectionCircle(largestRadius);
		RefreshRackWells(largestRadius);
		Vector2 viewportOrigin = CanvasHelper.MinimizeDimensions(_backBuffer, 0.025);
		CanvasHelper.CenterChildren(_backBuffer, viewportOrigin);
		CanvasHelper.AssignBorderThicknessToChildren(_backBuffer, 0.0015);
		FrontBuffer = _backBuffer;
	}

	private static ShapeUI RetrieveRackWellDrawingFromHost(IReadOnlyList<UIElement> rackWellHosts, int index)
	{
		return (CircularWellViewModel)((ContentControl)rackWellHosts[index]).Content;
	}
}
