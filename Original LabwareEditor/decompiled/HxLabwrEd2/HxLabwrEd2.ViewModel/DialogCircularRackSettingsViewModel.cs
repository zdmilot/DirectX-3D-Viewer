using System;
using System.ComponentModel;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class DialogCircularRackSettingsViewModel : DialogViewModelBase
{
	private const string RectangularBoundaryImage = "/Images/CircularRackRectangularBoundary500x500.png";

	private const string CircularBoundaryImage = "/Images/CircularRackCircularBoundary500x500.png";

	private const string FirstSegmentIncrementClockwiseImage = "/Images/CircularRackClockwiseFirstSegment500x500.png";

	private const string FirstSegmentIncrementCounterClockwiseImage = "/Images/CircularRackCounterClockwiseFirstSegment500x500.png";

	private const string LastSegmentIncrementClockwiseImage = "/Images/CircularRackClockwiseLastSegment500x500.png";

	private const string LastSegmentIncrementCounterClockwiseImage = "/Images/CircularRackCounterClockwiseLastSegment500x500.png";

	private CircularRack _circularRackPartialDuplicate;

	private CircularRack _loadedCircularRack;

	private double _diameter;

	private ArcAngleDirection _incrementDirection;

	private string _sequenceImage;

	private string _boundaryImage;

	public bool BoundaryIsCircular => !BoundaryIsRectangular;

	public bool BoundaryIsRectangular
	{
		get
		{
			if (CircularRackPartialDuplicate != null)
			{
				return CircularRackPartialDuplicate.BoundaryShape == Shape.Rectangle;
			}
			return false;
		}
	}

	public double Diameter
	{
		get
		{
			return _diameter;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => Diameter), ref _diameter, value))
			{
				CircularRackPartialDuplicate.DataChanged = true;
			}
		}
	}

	public CircularRack CircularRackPartialDuplicate
	{
		get
		{
			return _circularRackPartialDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<CircularRack>((Expression<Func<CircularRack>>)(() => CircularRackPartialDuplicate), ref _circularRackPartialDuplicate, value);
		}
	}

	public ArcAngleDirection IncrementDirection
	{
		get
		{
			return _incrementDirection;
		}
		set
		{
			if (((ObservableObject)this).Set<ArcAngleDirection>((Expression<Func<ArcAngleDirection>>)(() => IncrementDirection), ref _incrementDirection, value) && _circularRackPartialDuplicate != null)
			{
				CircularRackPartialDuplicate.CircularDefaultSequence.IncrementDirection = _incrementDirection;
			}
		}
	}

	public string SequenceImage
	{
		get
		{
			return _sequenceImage;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SequenceImage), ref _sequenceImage, value);
		}
	}

	public string BoundaryImage
	{
		get
		{
			return _boundaryImage;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => BoundaryImage), ref _boundaryImage, value);
		}
	}

	public DialogCircularRackSettingsViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogCircularRackSettingsSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
	}

	~DialogCircularRackSettingsViewModel()
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

	private void SetupLoadedLabware(Labware loadedLabware)
	{
		_loadedCircularRack = loadedLabware as CircularRack;
		CircularRackPartialDuplicate = new CircularRack();
		_circularRackPartialDuplicate.ReadOnly = _loadedCircularRack.ReadOnly;
		_circularRackPartialDuplicate.Dimensions = new Dimensions(_loadedCircularRack.Dimensions);
		_circularRackPartialDuplicate.BoundaryOffsets = new Offsets(_loadedCircularRack.BoundaryOffsets);
		_circularRackPartialDuplicate.BoundaryShape = ((_loadedCircularRack.BoundaryShape == Shape.Rectangle) ? Shape.Rectangle : Shape.Cylinder);
		_circularRackPartialDuplicate.CircularDefaultSequence = new CircularDefaultSequence(_loadedCircularRack.CircularDefaultSequence);
		IncrementDirection = _circularRackPartialDuplicate.CircularDefaultSequence.IncrementDirection;
		InitializeImages();
		CircularRackPartialDuplicate.DataChanged = false;
		((ObservableObject)CircularRackPartialDuplicate).PropertyChanged += delegate(object sender, PropertyChangedEventArgs args)
		{
			TripDirtyFlag();
			if (string.Equals(args.PropertyName, "BoundaryShape"))
			{
				SetBoundaryImage();
				((ObservableObject)this).RaisePropertyChanged("BoundaryIsRectangular");
				((ObservableObject)this).RaisePropertyChanged("BoundaryIsCircular");
			}
		};
		((ObservableObject)CircularRackPartialDuplicate.CircularDefaultSequence).PropertyChanged += delegate
		{
			TripDirtyFlag();
			CircularRackPartialDuplicate.DataChanged = true;
			((ObservableObject)this).RaisePropertyChanged("DataChanged");
			SetSequenceImage();
		};
		IncrementDirection = CircularRackPartialDuplicate.CircularDefaultSequence.IncrementDirection;
	}

	private void TripDirtyFlag()
	{
		CircularRackPartialDuplicate.DataChanged = true;
		((ObservableObject)this).RaisePropertyChanged("DataChanged");
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		_loadedCircularRack = null;
		CircularRackPartialDuplicate = null;
	}

	private void ExecuteSaveButton()
	{
		_loadedCircularRack.BoundaryOffsets = new Offsets(_circularRackPartialDuplicate.BoundaryOffsets);
		_loadedCircularRack.BoundaryShape = ((CircularRackPartialDuplicate.BoundaryShape == Shape.Rectangle) ? Shape.Rectangle : Shape.Cylinder);
		if (_loadedCircularRack.BoundaryShape == Shape.Cylinder)
		{
			CircularRackPartialDuplicate.Dimensions.X = Diameter;
			CircularRackPartialDuplicate.Dimensions.Y = Diameter;
		}
		_loadedCircularRack.Dimensions = new Dimensions(_circularRackPartialDuplicate.Dimensions);
		_loadedCircularRack.CircularDefaultSequence = new CircularDefaultSequence(CircularRackPartialDuplicate.CircularDefaultSequence);
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		_loadedCircularRack = null;
		CircularRackPartialDuplicate = null;
	}

	private void InitializeImages()
	{
		Diameter = CircularRackPartialDuplicate.Dimensions.X;
		SetBoundaryImage();
		SetSequenceImage();
	}

	private void SetBoundaryImage()
	{
		if (CircularRackPartialDuplicate != null)
		{
			BoundaryImage = ((CircularRackPartialDuplicate.BoundaryShape == Shape.Rectangle) ? "/Images/CircularRackRectangularBoundary500x500.png" : "/Images/CircularRackCircularBoundary500x500.png");
		}
	}

	private void SetSequenceImage()
	{
		if (CircularRackPartialDuplicate != null)
		{
			switch (CircularRackPartialDuplicate.CircularDefaultSequence.IncrementDirection)
			{
			case ArcAngleDirection.Clockwise:
				SequenceImage = ((CircularRackPartialDuplicate.CircularDefaultSequence.StartingSegment == Segment.FirstSegment) ? "/Images/CircularRackClockwiseFirstSegment500x500.png" : "/Images/CircularRackClockwiseLastSegment500x500.png");
				break;
			case ArcAngleDirection.CounterClockwise:
				SequenceImage = ((CircularRackPartialDuplicate.CircularDefaultSequence.StartingSegment == Segment.FirstSegment) ? "/Images/CircularRackCounterClockwiseFirstSegment500x500.png" : "/Images/CircularRackCounterClockwiseLastSegment500x500.png");
				break;
			default:
				throw new ArgumentOutOfRangeException();
			}
		}
	}
}
