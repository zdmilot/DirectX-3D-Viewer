using System;
using System.Linq.Expressions;
using System.Windows.Media;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using HxLabwrEd2.CustomControls.RackDrawing.CircularRackDrawingMath;

namespace HxLabwrEd2.CustomControls;

public class ShapeUI : ViewModelBase
{
	protected static Brush HighlightBrush = new SolidColorBrush(Color.FromRgb(byte.MaxValue, 130, 130));

	protected static Brush FillBrush = new SolidColorBrush(Color.FromRgb(25, 140, 225));

	protected static Brush GreyishBrush = new SolidColorBrush(Color.FromRgb(234, 234, 234));

	protected static Brush WhiteBrush = new SolidColorBrush(Color.FromRgb(byte.MaxValue, byte.MaxValue, byte.MaxValue));

	protected static Brush ErrorBrush = new SolidColorBrush(Color.FromRgb(byte.MaxValue, 60, 60));

	protected static Brush RedBrush = new SolidColorBrush(Color.FromRgb(byte.MaxValue, 0, 0));

	protected static Brush BorderDefaultBrush = new SolidColorBrush(Color.FromRgb(0, 0, 0));

	private Brush fill;

	protected Brush savedFill;

	protected Brush highlightFill;

	private object toolTip;

	private RelayCommand highlight;

	private RelayCommand unHighlight;

	private double strokeThickness;

	private Brush strokeColor;

	private bool enabled;

	private int id;

	public Vector2 Dimensions => DetermineDimensions();

	public int Id
	{
		get
		{
			return id;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => Id), ref id, value);
		}
	}

	public bool Enabled
	{
		get
		{
			return enabled;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => Enabled), ref enabled, value);
		}
	}

	public Brush StrokeColor
	{
		get
		{
			return strokeColor;
		}
		set
		{
			((ObservableObject)this).Set<Brush>((Expression<Func<Brush>>)(() => StrokeColor), ref strokeColor, value);
		}
	}

	public Brush Fill
	{
		get
		{
			return fill;
		}
		set
		{
			((ObservableObject)this).Set<Brush>((Expression<Func<Brush>>)(() => Fill), ref fill, value);
		}
	}

	public object ToolTip
	{
		get
		{
			return toolTip;
		}
		set
		{
			((ObservableObject)this).Set<object>((Expression<Func<object>>)(() => ToolTip), ref toolTip, value);
		}
	}

	public double StrokeThickness
	{
		get
		{
			return strokeThickness;
		}
		set
		{
			((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => StrokeThickness), ref strokeThickness, value);
		}
	}

	public RelayCommand Highlight
	{
		get
		{
			return highlight;
		}
		set
		{
			((ObservableObject)this).Set<RelayCommand>((Expression<Func<RelayCommand>>)(() => Highlight), ref highlight, value);
		}
	}

	public RelayCommand UnHighlight
	{
		get
		{
			return unHighlight;
		}
		set
		{
			((ObservableObject)this).Set<RelayCommand>((Expression<Func<RelayCommand>>)(() => UnHighlight), ref unHighlight, value);
		}
	}

	public ShapeUI()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		Highlight = new RelayCommand((Action)ExecuteHighlight, false);
		UnHighlight = new RelayCommand((Action)ExecuteUnHighlight, false);
		StrokeColor = BorderDefaultBrush;
		StrokeThickness = 1.0;
		Enabled = true;
		Id = 0;
	}

	private void ExecuteHighlight()
	{
		savedFill = Fill;
		Fill = highlightFill;
	}

	private void ExecuteUnHighlight()
	{
		Fill = savedFill;
	}

	protected virtual Vector2 DetermineDimensions()
	{
		return Vector2.Zero();
	}
}
