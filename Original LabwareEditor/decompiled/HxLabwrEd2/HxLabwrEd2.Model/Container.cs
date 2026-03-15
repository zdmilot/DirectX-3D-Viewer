using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;

namespace HxLabwrEd2.Model;

public class Container : Labware
{
	private TrulyObservableCollection<ContainerSegment> segments;

	private double baseThickness;

	private double deadVolumeHeight;

	private double bottomTouchOffHeight;

	private LLD lldData;

	private WickTouchOff wickTouchOffData;

	public TrulyObservableCollection<ContainerSegment> Segments
	{
		get
		{
			return segments;
		}
		set
		{
			if (segments != value)
			{
				if (segments != null)
				{
					segments.CollectionChanged -= base.CollectionChangedDelegate;
				}
				((ObservableObject)this).Set<TrulyObservableCollection<ContainerSegment>>((Expression<Func<TrulyObservableCollection<ContainerSegment>>>)(() => Segments), ref segments, value);
				if (segments != null)
				{
					segments.CollectionChanged += base.CollectionChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public double BaseThickness
	{
		get
		{
			return baseThickness;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => BaseThickness), ref baseThickness, Math.Round(value, 3, MidpointRounding.AwayFromZero)))
			{
				base.DataChanged = true;
			}
		}
	}

	public double DeadVolumeHeight
	{
		get
		{
			return deadVolumeHeight;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => DeadVolumeHeight), ref deadVolumeHeight, Math.Round(value, 3, MidpointRounding.AwayFromZero)))
			{
				base.DataChanged = true;
			}
		}
	}

	public double BottomTouchOffHeight
	{
		get
		{
			return bottomTouchOffHeight;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => BottomTouchOffHeight), ref bottomTouchOffHeight, Math.Round(value, 3, MidpointRounding.AwayFromZero)))
			{
				base.DataChanged = true;
			}
		}
	}

	public LLD LLDData
	{
		get
		{
			return lldData;
		}
		set
		{
			if (lldData != value)
			{
				if (lldData != null)
				{
					((ObservableObject)lldData).PropertyChanged -= base.DataChangedDelegate;
				}
				((ObservableObject)this).Set<LLD>((Expression<Func<LLD>>)(() => LLDData), ref lldData, value);
				if (lldData != null)
				{
					((ObservableObject)lldData).PropertyChanged += base.DataChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public Shape ApertureShape { get; set; }

	public double TotalInnerDepth { get; set; }

	public WickTouchOff WickTouchOffData
	{
		get
		{
			return wickTouchOffData;
		}
		set
		{
			if (wickTouchOffData != value)
			{
				if (wickTouchOffData != null)
				{
					((ObservableObject)wickTouchOffData).PropertyChanged -= base.DataChangedDelegate;
				}
				((ObservableObject)this).Set<WickTouchOff>((Expression<Func<WickTouchOff>>)(() => WickTouchOffData), ref wickTouchOffData, value);
				if (wickTouchOffData != null)
				{
					((ObservableObject)wickTouchOffData).PropertyChanged += base.DataChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	private void SubscribeToPropertyEvents()
	{
		if (Segments != null)
		{
			Segments.CollectionChanged += base.CollectionChangedDelegate;
		}
		if (WickTouchOffData != null)
		{
			((ObservableObject)WickTouchOffData).PropertyChanged += base.DataChangedDelegate;
		}
		if (LLDData != null)
		{
			((ObservableObject)LLDData).PropertyChanged += base.DataChangedDelegate;
		}
	}

	public Container()
	{
		lldData = new LLD();
		segments = new TrulyObservableCollection<ContainerSegment>();
		ApertureShape = Shape.Cylinder;
		wickTouchOffData = new WickTouchOff();
		SubscribeToPropertyEvents();
	}

	~Container()
	{
		if (Segments != null)
		{
			Segments.CollectionChanged -= base.CollectionChangedDelegate;
		}
		if (WickTouchOffData != null)
		{
			((ObservableObject)WickTouchOffData).PropertyChanged -= base.DataChangedDelegate;
		}
		if (LLDData != null)
		{
			((ObservableObject)LLDData).PropertyChanged -= base.DataChangedDelegate;
		}
	}
}
