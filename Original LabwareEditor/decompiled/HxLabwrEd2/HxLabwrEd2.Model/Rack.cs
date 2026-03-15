using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using Hamilton.Interop.HxCfgFil;

namespace HxLabwrEd2.Model;

public class Rack : Labware
{
	private double _stackHeight;

	private RackContainer _singleRepeatingContainer;

	private bool _containersAreConnected;

	private ContainerLayout _containerLayout;

	private Hole _hole;

	private TrulyObservableCollection<RackWell> _rackWells;

	private double _wellDiameter;

	private Dictionary<string, DrawContainer> _drawContainers;

	private Cover _cover;

	private bool _useCover;

	private int _numberOfContainers;

	public const double DefaultWellDiameter = 2.5;

	public int NumberOfContainers
	{
		get
		{
			return _numberOfContainers;
		}
		set
		{
			((ObservableObject)this).Set<int>((Expression<Func<int>>)(() => NumberOfContainers), ref _numberOfContainers, value);
		}
	}

	public Dictionary<string, DrawContainer> DrawContainers
	{
		get
		{
			return _drawContainers;
		}
		set
		{
			((ObservableObject)this).Set<Dictionary<string, DrawContainer>>((Expression<Func<Dictionary<string, DrawContainer>>>)(() => DrawContainers), ref _drawContainers, value);
		}
	}

	public TrulyObservableCollection<RackWell> RackWells
	{
		get
		{
			return _rackWells;
		}
		set
		{
			if (value != _rackWells)
			{
				if (_rackWells != null)
				{
					_rackWells.CollectionChanged -= base.CollectionChangedDelegate;
				}
				((ObservableObject)this).Set<TrulyObservableCollection<RackWell>>((Expression<Func<TrulyObservableCollection<RackWell>>>)(() => RackWells), ref _rackWells, value);
				if (_rackWells != null)
				{
					_rackWells.CollectionChanged += base.CollectionChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public Hole Hole
	{
		get
		{
			return _hole;
		}
		set
		{
			((ObservableObject)this).Set<Hole>((Expression<Func<Hole>>)(() => Hole), ref _hole, value);
		}
	}

	public double WellDiameter
	{
		get
		{
			return _wellDiameter;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => WellDiameter), ref _wellDiameter, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public double StackHeight
	{
		get
		{
			return _stackHeight;
		}
		set
		{
			if (((ObservableObject)this).Set<double>((Expression<Func<double>>)(() => StackHeight), ref _stackHeight, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public RackContainer SingleRepeatingContainer
	{
		get
		{
			return _singleRepeatingContainer;
		}
		set
		{
			if (_singleRepeatingContainer != null)
			{
				((ObservableObject)_singleRepeatingContainer).PropertyChanged -= base.DataChangedDelegate;
			}
			((ObservableObject)this).Set<RackContainer>((Expression<Func<RackContainer>>)(() => SingleRepeatingContainer), ref _singleRepeatingContainer, value);
			if (_singleRepeatingContainer != null)
			{
				((ObservableObject)_singleRepeatingContainer).PropertyChanged += base.DataChangedDelegate;
			}
			base.DataChanged = true;
		}
	}

	public bool ContainersAreConnected
	{
		get
		{
			return _containersAreConnected;
		}
		set
		{
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ContainersAreConnected), ref _containersAreConnected, value))
			{
				base.DataChanged = true;
			}
		}
	}

	public ContainerLayout ContainerLayout
	{
		get
		{
			return _containerLayout;
		}
		set
		{
			if (ContainerLayout != value)
			{
				OnUpdateContainerLayout(value);
				((ObservableObject)this).Set<ContainerLayout>((Expression<Func<ContainerLayout>>)(() => ContainerLayout), ref _containerLayout, value);
				base.DataChanged = true;
			}
		}
	}

	public Cover Cover
	{
		get
		{
			return _cover;
		}
		set
		{
			if (value != _cover)
			{
				if (_cover != null)
				{
					((ObservableObject)_cover).PropertyChanged -= base.DataChangedDelegate;
				}
				((ObservableObject)this).Set<Cover>((Expression<Func<Cover>>)(() => Cover), ref _cover, value);
				if (_cover != null)
				{
					((ObservableObject)_cover).PropertyChanged += base.DataChangedDelegate;
				}
				base.DataChanged = true;
			}
		}
	}

	public bool UseCover
	{
		get
		{
			return _useCover;
		}
		set
		{
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => UseCover), ref _useCover, value))
			{
				base.DataChanged = true;
				if (_useCover && _cover == null)
				{
					Cover = new Cover
					{
						Dimensions = 
						{
							X = dimensions.X,
							Y = dimensions.Y,
							Z = dimensions.Z / 2.0
						},
						Thickness = Math.Round(dimensions.Z / 2.0 - (dimensions.Z - (dimensions.Z / 2.0 + 1.5)), 2, MidpointRounding.AwayFromZero),
						RackBaseToCoverBase = Math.Round(dimensions.Z / 2.0 + 1.5, 2, MidpointRounding.AwayFromZero),
						OverriddenExtent = new Dimensions(dimensions.X, dimensions.Y, 0.0),
						OverrideExtent = false
					};
				}
			}
		}
	}

	protected void UpdateRackWellContainers(ContainerLayout newLayout)
	{
		switch (newLayout)
		{
		case ContainerLayout.WellsOnly:
		{
			foreach (RackWell rackWell in RackWells)
			{
				rackWell.ContainerFilePath = "";
				rackWell.ContainerRelativeFilePath = "";
				rackWell.ContainerOffsets = new Offsets();
			}
			break;
		}
		case ContainerLayout.SingleContainer:
		{
			foreach (RackWell rackWell2 in RackWells)
			{
				try
				{
					rackWell2.ContainerFilePath = SingleRepeatingContainer.FilePath;
					rackWell2.ContainerRelativeFilePath = SingleRepeatingContainer.RelativeFilePath;
					rackWell2.ContainerOffsets = new Offsets(SingleRepeatingContainer.Offsets);
				}
				catch (Exception)
				{
				}
			}
			break;
		}
		}
	}

	protected virtual void OnUpdateContainerLayout(ContainerLayout containerLayout)
	{
	}

	public Rack()
	{
		SingleRepeatingContainer = new RackContainer();
		Hole = new Hole();
		RackWells = new TrulyObservableCollection<RackWell>();
		DrawContainers = new Dictionary<string, DrawContainer>();
		WellDiameter = 2.5;
	}

	~Rack()
	{
		UnsubscribeFromPropertyEvents();
	}

	public Rack(Rack rack)
		: base(rack)
	{
		_stackHeight = rack._stackHeight;
		_singleRepeatingContainer = new RackContainer(rack._singleRepeatingContainer);
		_containersAreConnected = rack._containersAreConnected;
		_containerLayout = rack._containerLayout;
		_hole = new Hole(rack._hole);
		_rackWells = new TrulyObservableCollection<RackWell>();
		_wellDiameter = rack._wellDiameter;
		_drawContainers = new Dictionary<string, DrawContainer>();
		_cover = new Cover(rack._cover);
		_useCover = rack._useCover;
		_numberOfContainers = rack._numberOfContainers;
		foreach (RackWell rackWell in rack._rackWells)
		{
			_rackWells.Add(new RackWell(rackWell));
		}
		_drawContainers = rack._drawContainers.ToDictionary((KeyValuePair<string, DrawContainer> entry) => entry.Key, (KeyValuePair<string, DrawContainer> entry) => entry.Value);
	}

	public void RegenerateRackWells()
	{
		List<RackContainer> list = new List<RackContainer>();
		if (ContainerLayout == ContainerLayout.SingleContainer)
		{
			list.Add(new RackContainer
			{
				FilePath = _singleRepeatingContainer.FilePath,
				RelativeFilePath = _singleRepeatingContainer.RelativeFilePath,
				Offsets = new Offsets(_singleRepeatingContainer.Offsets)
			});
		}
		if (ContainerLayout == ContainerLayout.MultipleContainers)
		{
			foreach (RackWell rackWell in RackWells)
			{
				RackContainer item = new RackContainer
				{
					FilePath = rackWell.ContainerFilePath,
					RelativeFilePath = rackWell.ContainerRelativeFilePath,
					Offsets = new Offsets(rackWell.ContainerOffsets)
				};
				list.Add(item);
			}
		}
		OnRegenerateRackWells();
		if (ContainerLayout == ContainerLayout.SingleContainer)
		{
			foreach (RackWell rackWell2 in RackWells)
			{
				rackWell2.ContainerFilePath = list[0].FilePath;
				rackWell2.ContainerRelativeFilePath = list[0].RelativeFilePath;
				rackWell2.ContainerOffsets = new Offsets(list[0].Offsets);
			}
			return;
		}
		if (ContainerLayout == ContainerLayout.MultipleContainers)
		{
			int num = ((list.Count > RackWells.Count) ? RackWells.Count : list.Count);
			for (int i = 0; i < num; i++)
			{
				RackWells[i].ContainerFilePath = list[i].FilePath;
				RackWells[i].ContainerRelativeFilePath = list[i].RelativeFilePath;
				RackWells[i].ContainerOffsets = new Offsets(list[i].Offsets);
			}
		}
	}

	public void RefreshRackWellsWithRepeatingData()
	{
		foreach (RackWell rackWell in RackWells)
		{
			rackWell.ContainerFilePath = SingleRepeatingContainer.FilePath;
			rackWell.ContainerRelativeFilePath = SingleRepeatingContainer.RelativeFilePath;
			rackWell.ContainerOffsets = new Offsets(SingleRepeatingContainer.Offsets.X, SingleRepeatingContainer.Offsets.Y, SingleRepeatingContainer.Offsets.Z);
		}
	}

	public void UpdateRackWellsWithRepeatedContainerOffsets()
	{
		if (SingleRepeatingContainer.Offsets.X != RackWells.First().ContainerOffsets.X)
		{
			foreach (RackWell rackWell in RackWells)
			{
				rackWell.ContainerOffsets.X = SingleRepeatingContainer.Offsets.X;
			}
		}
		if (SingleRepeatingContainer.Offsets.Y != RackWells.First().ContainerOffsets.Y)
		{
			foreach (RackWell rackWell2 in RackWells)
			{
				rackWell2.ContainerOffsets.Y = SingleRepeatingContainer.Offsets.Y;
			}
		}
		if (SingleRepeatingContainer.Offsets.Z == RackWells.First().ContainerOffsets.Z)
		{
			return;
		}
		foreach (RackWell rackWell3 in RackWells)
		{
			rackWell3.ContainerOffsets.Z = SingleRepeatingContainer.Offsets.Z;
		}
	}

	protected void SubscribeToPropertyEvents()
	{
		if (SingleRepeatingContainer != null)
		{
			((ObservableObject)SingleRepeatingContainer).PropertyChanged += base.DataChangedDelegate;
			if (SingleRepeatingContainer.Offsets != null)
			{
				((ObservableObject)SingleRepeatingContainer.Offsets).PropertyChanged += base.DataChangedDelegate;
			}
		}
		if (RackWells != null)
		{
			RackWells.CollectionChanged += base.CollectionChangedDelegate;
		}
		if (Cover != null)
		{
			((ObservableObject)Cover).PropertyChanged += base.DataChangedDelegate;
		}
		OnSubscribeToPropertyEvents();
	}

	protected virtual void OnSubscribeToPropertyEvents()
	{
	}

	protected void UnsubscribeFromPropertyEvents()
	{
		if (SingleRepeatingContainer != null)
		{
			((ObservableObject)SingleRepeatingContainer).PropertyChanged -= base.DataChangedDelegate;
			if (SingleRepeatingContainer.Offsets != null)
			{
				((ObservableObject)SingleRepeatingContainer.Offsets).PropertyChanged -= base.DataChangedDelegate;
			}
		}
		if (RackWells != null)
		{
			RackWells.CollectionChanged -= base.CollectionChangedDelegate;
		}
		if (Cover != null)
		{
			((ObservableObject)Cover).PropertyChanged -= base.DataChangedDelegate;
		}
		OnUnsubscribeFromPropertyEvents();
	}

	protected virtual void OnUnsubscribeFromPropertyEvents()
	{
	}

	public virtual void GenerateRackWells(List<RackContainer> rackContainers)
	{
	}

	public virtual void ReadDefaultSequenceData(HxCfgFile configFile)
	{
	}

	protected virtual void OnRegenerateRackWells()
	{
	}
}
