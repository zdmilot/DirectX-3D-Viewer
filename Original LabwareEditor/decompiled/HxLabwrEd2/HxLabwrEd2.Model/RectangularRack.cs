using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using GalaSoft.MvvmLight;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.Model;

public class RectangularRack : Rack
{
	private int rows;

	private int columns;

	private TrulyObservableCollection<GripSegment> gripSegmentsX;

	private TrulyObservableCollection<GripSegment> gripSegmentsY;

	private WellPattern wellPattern;

	private Stagger stagger;

	private int irregularWellUserCount;

	private Orientation orientation;

	private double rowSpacing;

	private double columnSpacing;

	private bool useGripSegments;

	private Offsets irregularRackBoundaryOffsets;

	private RectangularDefaultSequence _rectangularDefaultSequence;

	public RectangularDefaultSequence RectangularDefaultSequence
	{
		get
		{
			return _rectangularDefaultSequence;
		}
		set
		{
			if (value != _rectangularDefaultSequence)
			{
				if (_rectangularDefaultSequence != null)
				{
					((ObservableObject)_rectangularDefaultSequence).PropertyChanged -= base.DataChangedDelegate;
				}
				((ObservableObject)this).Set<RectangularDefaultSequence>((Expression<Func<RectangularDefaultSequence>>)(() => RectangularDefaultSequence), ref _rectangularDefaultSequence, value);
				if (_rectangularDefaultSequence != null)
				{
					((ObservableObject)_rectangularDefaultSequence).PropertyChanged += base.DataChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public int Rows
	{
		get
		{
			return rows;
		}
		set
		{
			if (((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => Rows), ref rows, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public int Columns
	{
		get
		{
			return columns;
		}
		set
		{
			if (((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => Columns), ref columns, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public TrulyObservableCollection<GripSegment> GripSegmentsX
	{
		get
		{
			return gripSegmentsX;
		}
		set
		{
			if (value != gripSegmentsX)
			{
				if (gripSegmentsX != null)
				{
					gripSegmentsX.CollectionChanged -= base.CollectionChangedDelegate;
				}
				((ObservableObject)this).Set<TrulyObservableCollection<GripSegment>>((Expression<Func<TrulyObservableCollection<GripSegment>>>)(() => GripSegmentsX), ref gripSegmentsX, value);
				if (gripSegmentsX != null)
				{
					gripSegmentsX.CollectionChanged += base.CollectionChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public TrulyObservableCollection<GripSegment> GripSegmentsY
	{
		get
		{
			return gripSegmentsY;
		}
		set
		{
			if (value != gripSegmentsY)
			{
				if (gripSegmentsY != null)
				{
					gripSegmentsY.CollectionChanged -= base.CollectionChangedDelegate;
				}
				((ObservableObject)this).Set<TrulyObservableCollection<GripSegment>>((Expression<Func<TrulyObservableCollection<GripSegment>>>)(() => GripSegmentsY), ref gripSegmentsY, value);
				if (gripSegmentsY != null)
				{
					gripSegmentsY.CollectionChanged += base.CollectionChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public WellPattern WellPattern
	{
		get
		{
			return wellPattern;
		}
		set
		{
			if (WellPattern == value)
			{
				return;
			}
			if (!base.Loading)
			{
				switch (value)
				{
				case WellPattern.Standard96Plate:
					RowSpacing = 9.0;
					ColumnSpacing = 9.0;
					Stagger = new Stagger();
					RectangularDefaultSequence = new RectangularDefaultSequence();
					if (Orientation == Orientation.Landscape)
					{
						Rows = 8;
						Columns = 12;
						base.BoundaryOffsets.X = 14.0;
						base.BoundaryOffsets.Y = 11.5;
						IrregularRackBoundaryOffsets.X = 14.0;
						irregularRackBoundaryOffsets.Y = 11.5 + (double)(Rows - 1) * RowSpacing;
						base.Dimensions.X = 127.0;
						base.Dimensions.Y = 86.0;
					}
					else
					{
						Rows = 12;
						Columns = 8;
						base.BoundaryOffsets.X = 11.5;
						base.BoundaryOffsets.Y = 14.0;
						IrregularRackBoundaryOffsets.X = 11.5;
						irregularRackBoundaryOffsets.Y = 14.0;
						base.Dimensions.X = 86.0;
						base.Dimensions.Y = 127.0;
						RectangularDefaultSequence.StartCorner = Corner.FrontLeft;
						RectangularDefaultSequence.IncrementDirection = IncrementDirection.ColumnFirst;
					}
					break;
				case WellPattern.Standard384Plate:
					RowSpacing = 4.5;
					ColumnSpacing = 4.5;
					Stagger = new Stagger();
					RectangularDefaultSequence = new RectangularDefaultSequence();
					if (Orientation == Orientation.Landscape)
					{
						Rows = 16;
						Columns = 24;
						base.BoundaryOffsets.X = 11.75;
						base.BoundaryOffsets.Y = 9.25;
						IrregularRackBoundaryOffsets.X = 11.75;
						irregularRackBoundaryOffsets.Y = 9.25 + (double)(Rows - 1) * RowSpacing;
						base.Dimensions.X = 127.0;
						base.Dimensions.Y = 86.0;
					}
					else
					{
						Rows = 24;
						Columns = 16;
						base.BoundaryOffsets.X = 9.25;
						base.BoundaryOffsets.Y = 11.75;
						IrregularRackBoundaryOffsets.X = 9.25;
						irregularRackBoundaryOffsets.Y = 11.75;
						base.Dimensions.X = 86.0;
						base.Dimensions.Y = 127.0;
						RectangularDefaultSequence.StartCorner = Corner.FrontLeft;
						RectangularDefaultSequence.IncrementDirection = IncrementDirection.ColumnFirst;
					}
					break;
				case WellPattern.Standard1536Plate:
					RowSpacing = 2.25;
					ColumnSpacing = 2.25;
					Stagger = new Stagger();
					RectangularDefaultSequence = new RectangularDefaultSequence();
					if (Orientation == Orientation.Landscape)
					{
						Rows = 32;
						Columns = 48;
						base.BoundaryOffsets.X = 10.625;
						base.BoundaryOffsets.Y = 8.125;
						IrregularRackBoundaryOffsets.X = 10.625;
						irregularRackBoundaryOffsets.Y = 8.125 + (double)(Rows - 1) * RowSpacing;
						base.Dimensions.X = 127.0;
						base.Dimensions.Y = 86.0;
					}
					else
					{
						Rows = 48;
						Columns = 32;
						base.BoundaryOffsets.X = 8.125;
						base.BoundaryOffsets.Y = 10.625;
						IrregularRackBoundaryOffsets.X = 8.125;
						irregularRackBoundaryOffsets.Y = 10.625;
						base.Dimensions.X = 86.0;
						base.Dimensions.Y = 127.0;
						RectangularDefaultSequence.StartCorner = Corner.FrontLeft;
						RectangularDefaultSequence.IncrementDirection = IncrementDirection.ColumnFirst;
					}
					break;
				}
				if (value != WellPattern.Irregular)
				{
					RegenerateRackWells();
				}
			}
			((ObservableObject)this).Set<WellPattern>((Expression<Func<WellPattern>>)(() => WellPattern), ref wellPattern, value);
			base.DataChanged = true;
		}
	}

	public Stagger Stagger
	{
		get
		{
			return stagger;
		}
		set
		{
			if (value != stagger)
			{
				if (stagger != null)
				{
					((ObservableObject)stagger).PropertyChanged -= base.DataChangedDelegate;
				}
				((ObservableObject)this).Set<Stagger>((Expression<Func<Stagger>>)(() => Stagger), ref stagger, value);
				if (RectangularDefaultSequence != null)
				{
					((ObservableObject)stagger).PropertyChanged += base.DataChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public int IrregularWellUserCount
	{
		get
		{
			return irregularWellUserCount;
		}
		set
		{
			if (((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => IrregularWellUserCount), ref irregularWellUserCount, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public Orientation Orientation
	{
		get
		{
			return orientation;
		}
		set
		{
			if (Orientation == value)
			{
				return;
			}
			if (!base.Loading)
			{
				int num = Columns;
				Columns = Rows;
				Rows = num;
				double num2 = RowSpacing;
				RowSpacing = ColumnSpacing;
				ColumnSpacing = num2;
				num2 = base.BoundaryOffsets.X;
				base.BoundaryOffsets.X = base.BoundaryOffsets.Y;
				base.BoundaryOffsets.Y = num2;
				num2 = base.Dimensions.X;
				base.Dimensions.X = base.Dimensions.Y;
				base.Dimensions.Y = num2;
				if (RectangularDefaultSequence.StartCorner == Corner.BackLeft)
				{
					RectangularDefaultSequence.StartCorner = Corner.FrontLeft;
				}
				else
				{
					RectangularDefaultSequence.StartCorner = Corner.BackLeft;
				}
				if (RectangularDefaultSequence.IncrementDirection == IncrementDirection.RowFirst)
				{
					RectangularDefaultSequence.IncrementDirection = IncrementDirection.ColumnFirst;
				}
				else
				{
					RectangularDefaultSequence.IncrementDirection = IncrementDirection.RowFirst;
				}
				IrregularRackBoundaryOffsets.X = base.BoundaryOffsets.X;
				if (RectangularDefaultSequence.StartCorner == Corner.BackLeft)
				{
					IrregularRackBoundaryOffsets.Y = base.BoundaryOffsets.Y + (double)(Rows - 1) * RowSpacing;
				}
				else
				{
					IrregularRackBoundaryOffsets.Y = base.BoundaryOffsets.Y;
				}
				RegenerateRackWells();
			}
			((ObservableObject)this).Set<Orientation>((Expression<Func<Orientation>>)(() => Orientation), ref orientation, value);
			base.DataChanged = true;
		}
	}

	public double RowSpacing
	{
		get
		{
			return rowSpacing;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => RowSpacing), ref rowSpacing, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public double ColumnSpacing
	{
		get
		{
			return columnSpacing;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => ColumnSpacing), ref columnSpacing, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public bool UseGripSegments
	{
		get
		{
			return useGripSegments;
		}
		set
		{
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => UseGripSegments), ref useGripSegments, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public Offsets IrregularRackBoundaryOffsets
	{
		get
		{
			return irregularRackBoundaryOffsets;
		}
		set
		{
			if (value != irregularRackBoundaryOffsets)
			{
				if (irregularRackBoundaryOffsets != null)
				{
					((ObservableObject)irregularRackBoundaryOffsets).PropertyChanged -= base.DataChangedDelegate;
				}
				((ObservableObject)this).Set<Offsets>((Expression<Func<Offsets>>)(() => IrregularRackBoundaryOffsets), ref irregularRackBoundaryOffsets, value);
				if (irregularRackBoundaryOffsets != null)
				{
					((ObservableObject)irregularRackBoundaryOffsets).PropertyChanged += base.DataChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public LegacyDataType LegacyDataType { get; set; }

	public RectangularRack()
	{
		RectangularDefaultSequence = new RectangularDefaultSequence();
		gripSegmentsX = new TrulyObservableCollection<GripSegment>();
		gripSegmentsY = new TrulyObservableCollection<GripSegment>();
		stagger = new Stagger();
		irregularRackBoundaryOffsets = new Offsets();
		useBoundary = true;
		boundaryShape = Shape.Rectangle;
		SubscribeToPropertyEvents();
		base.WellDiameter = 4.5;
	}

	public void GenerateRackWells(List<IrregularWell> irregularWells, List<RackContainer> rackContainers)
	{
		Dictionary<string, int> dictionary = null;
		RackWell rackWell = null;
		if (irregularWells == null || irregularWells.Count == 0)
		{
			dictionary = GenerateRackWellsWithRegularPattern();
		}
		else
		{
			dictionary = new Dictionary<string, int>();
			for (int i = 0; i < irregularWells.Count; i++)
			{
				rackWell = new RackWell(irregularWells[i]);
				base.RackWells.Insert(i, rackWell);
				dictionary.Add(rackWell.Label, i);
			}
		}
		if (base.ContainerLayout == ContainerLayout.WellsOnly)
		{
			return;
		}
		if (base.ContainerLayout == ContainerLayout.SingleContainer)
		{
			foreach (RackWell rackWell2 in base.RackWells)
			{
				rackWell2.ContainerFilePath = rackContainers[0].FilePath;
				rackWell2.ContainerRelativeFilePath = rackContainers[0].RelativeFilePath;
				rackWell2.ContainerOffsets.X = rackContainers[0].Offsets.X;
				rackWell2.ContainerOffsets.Y = rackContainers[0].Offsets.Y;
				rackWell2.ContainerOffsets.Z = rackContainers[0].Offsets.Z;
			}
			return;
		}
		int num = 0;
		foreach (RackContainer rackContainer in rackContainers)
		{
			num = dictionary[rackContainer.WellPositionLabel];
			if (num > -1)
			{
				base.RackWells[num].ContainerFilePath = rackContainer.FilePath;
				base.RackWells[num].ContainerRelativeFilePath = rackContainer.RelativeFilePath;
				base.RackWells[num].ContainerOffsets.X = rackContainer.Offsets.X;
				base.RackWells[num].ContainerOffsets.Y = rackContainer.Offsets.Y;
				base.RackWells[num].ContainerOffsets.Z = rackContainer.Offsets.Z;
			}
		}
	}

	private Dictionary<string, int> GenerateRackWellsWithRegularPattern()
	{
		base.RackWells = new TrulyObservableCollection<RackWell>();
		RackWell rackWell = null;
		Dictionary<string, int> dictionary = null;
		if (RectangularDefaultSequence.StartCorner == Corner.BackLeft)
		{
			if (RectangularDefaultSequence.IncrementDirection == IncrementDirection.RowFirst)
			{
				for (int i = 0; i < Rows; i++)
				{
					for (int j = 0; j < Columns; j++)
					{
						rackWell = new RackWell();
						rackWell.CenterX = (double)j * ColumnSpacing;
						rackWell.CenterY = (double)(-1 * i) * RowSpacing;
						base.RackWells.Add(rackWell);
					}
				}
			}
			else
			{
				for (int k = 0; k < Columns; k++)
				{
					for (int l = 0; l < Rows; l++)
					{
						rackWell = new RackWell();
						rackWell.CenterX = (double)k * ColumnSpacing;
						rackWell.CenterY = (double)(-1 * l) * RowSpacing;
						base.RackWells.Add(rackWell);
					}
				}
			}
		}
		else if (RectangularDefaultSequence.IncrementDirection == IncrementDirection.RowFirst)
		{
			for (int m = 0; m < Rows; m++)
			{
				for (int n = 0; n < Columns; n++)
				{
					rackWell = new RackWell();
					rackWell.CenterX = (double)n * ColumnSpacing;
					rackWell.CenterY = (double)m * RowSpacing;
					base.RackWells.Add(rackWell);
				}
			}
		}
		else
		{
			for (int num = 0; num < Columns; num++)
			{
				for (int num2 = 0; num2 < Rows; num2++)
				{
					rackWell = new RackWell();
					rackWell.CenterX = (double)num * ColumnSpacing;
					rackWell.CenterY = (double)num2 * RowSpacing;
					base.RackWells.Add(rackWell);
				}
			}
		}
		if (Stagger.Enabled)
		{
			double num3 = 0.0;
			num3 = ((Stagger.OffsetDirection != OffsetDirection.In) ? (num3 - Stagger.OffsetValue) : (num3 + Stagger.OffsetValue));
			if (RectangularDefaultSequence.IncrementDirection == IncrementDirection.RowFirst)
			{
				for (int num4 = 1; num4 < Rows; num4 += 2)
				{
					for (int num5 = 0; num5 < Columns; num5++)
					{
						base.RackWells[num5 + num4 * Columns].CenterX += num3;
					}
				}
			}
			else
			{
				for (int num6 = 0; num6 < Columns; num6++)
				{
					for (int num7 = 1; num7 < Rows; num7 += 2)
					{
						base.RackWells[num7 + num6 * Rows].CenterX += num3;
					}
				}
			}
		}
		int num8 = 0;
		dictionary = new Dictionary<string, int>();
		if (RectangularDefaultSequence.UseDefaultStartValue)
		{
			Regex regex = new Regex("[^a-zA-Z -]");
			Regex regex2 = new Regex("[^0-9 -]");
			string text = regex.Replace(RectangularDefaultSequence.DefaultStartValue, "");
			int num9 = int.Parse(regex2.Replace(RectangularDefaultSequence.DefaultStartValue, ""));
			string text2 = text;
			int num10 = num9;
			int num11;
			int num12;
			if (RectangularDefaultSequence.IncrementDirection == IncrementDirection.RowFirst)
			{
				num11 = Columns;
				num12 = Rows;
			}
			else
			{
				num11 = Rows;
				num12 = Columns;
			}
			for (int num13 = 0; num13 < num12; num13++)
			{
				string input = text2;
				int num14 = num10;
				for (int num15 = 0; num15 < num11; num15++)
				{
					base.RackWells[num8].Label = text2 + num10;
					dictionary.Add(base.RackWells[num8].Label, num8);
					num10++;
					num8++;
				}
				text2 = AlphaValueHelper.IncrementAlphaValue(input);
				num10 = num14;
			}
		}
		else
		{
			int num16 = RectangularDefaultSequence.UserStartValue;
			for (int num17 = 0; num17 < base.RackWells.Count; num17++)
			{
				base.RackWells[num17].Label = num16.ToString();
				dictionary.Add(base.RackWells[num17].Label, num17);
				num16++;
			}
		}
		return dictionary;
	}

	protected override void OnSubscribeToPropertyEvents()
	{
		if (RectangularDefaultSequence != null)
		{
			((ObservableObject)RectangularDefaultSequence).PropertyChanged += base.DataChangedDelegate;
		}
		if (gripSegmentsX != null)
		{
			gripSegmentsX.CollectionChanged += base.CollectionChangedDelegate;
		}
		if (gripSegmentsY != null)
		{
			gripSegmentsY.CollectionChanged += base.CollectionChangedDelegate;
		}
		if (stagger != null)
		{
			((ObservableObject)stagger).PropertyChanged += base.DataChangedDelegate;
		}
		if (irregularRackBoundaryOffsets != null)
		{
			((ObservableObject)irregularRackBoundaryOffsets).PropertyChanged += base.DataChangedDelegate;
		}
	}

	protected override void OnUnsubscribeFromPropertyEvents()
	{
		if (RectangularDefaultSequence != null)
		{
			((ObservableObject)RectangularDefaultSequence).PropertyChanged -= base.DataChangedDelegate;
		}
		if (gripSegmentsX != null)
		{
			gripSegmentsX.CollectionChanged -= base.CollectionChangedDelegate;
		}
		if (gripSegmentsY != null)
		{
			gripSegmentsY.CollectionChanged -= base.CollectionChangedDelegate;
		}
		if (stagger != null)
		{
			((ObservableObject)stagger).PropertyChanged -= base.DataChangedDelegate;
		}
		if (irregularRackBoundaryOffsets != null)
		{
			((ObservableObject)irregularRackBoundaryOffsets).PropertyChanged -= base.DataChangedDelegate;
		}
	}

	protected override void OnUpdateContainerLayout(ContainerLayout containerLayout)
	{
		if (!base.Loading)
		{
			UpdateRackWellContainers(containerLayout);
		}
	}

	protected override void OnRegenerateRackWells()
	{
		GenerateRackWellsWithRegularPattern();
	}
}
