using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class DialogRackRegularPatternViewModel : DialogViewModelBase
{
	private RectangularRack rectangularRackPartialDuplicate;

	private RectangularRack loadedRectangularRack;

	private bool staggerEnabled;

	private OffsetDirection staggerDirection;

	private Corner firstWellCorner;

	private IncrementDirection incDirection;

	private bool useDefaultFirstValue;

	private string sequenceImage;

	private string staggerImage;

	public RectangularRack RectangularRackPartialDuplicate
	{
		get
		{
			return rectangularRackPartialDuplicate;
		}
		set
		{
			((ObservableObject)this).Set<RectangularRack>((Expression<Func<RectangularRack>>)(() => RectangularRackPartialDuplicate), ref rectangularRackPartialDuplicate, value);
		}
	}

	public bool StaggerEnabled
	{
		get
		{
			return staggerEnabled;
		}
		set
		{
			if (!((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => StaggerEnabled), ref staggerEnabled, value))
			{
				return;
			}
			if (rectangularRackPartialDuplicate != null)
			{
				rectangularRackPartialDuplicate.Stagger.Enabled = staggerEnabled;
			}
			if (staggerEnabled)
			{
				if (firstWellCorner == Corner.BackLeft)
				{
					if (staggerDirection == OffsetDirection.In)
					{
						StaggerImage = "/Images/StaggerInBack500x500.png";
					}
					else
					{
						StaggerImage = "/Images/StaggerOutBack500x500.png";
					}
				}
				else if (staggerDirection == OffsetDirection.In)
				{
					StaggerImage = "/Images/StaggerInFront500x500.png";
				}
				else
				{
					StaggerImage = "/Images/StaggerOutFront500x500.png";
				}
			}
			else
			{
				StaggerImage = "/Images/NoStagger500x500.png";
			}
		}
	}

	public OffsetDirection StaggerDirection
	{
		get
		{
			return staggerDirection;
		}
		set
		{
			if (!((ObservableObject)this).Set<OffsetDirection>((Expression<Func<OffsetDirection>>)(() => StaggerDirection), ref staggerDirection, value))
			{
				return;
			}
			if (rectangularRackPartialDuplicate != null)
			{
				rectangularRackPartialDuplicate.Stagger.OffsetDirection = staggerDirection;
			}
			if (!staggerEnabled)
			{
				return;
			}
			if (firstWellCorner == Corner.BackLeft)
			{
				if (staggerDirection == OffsetDirection.In)
				{
					StaggerImage = "/Images/StaggerInBack500x500.png";
				}
				else
				{
					StaggerImage = "/Images/StaggerOutBack500x500.png";
				}
			}
			else if (staggerDirection == OffsetDirection.In)
			{
				StaggerImage = "/Images/StaggerInFront500x500.png";
			}
			else
			{
				StaggerImage = "/Images/StaggerOutFront500x500.png";
			}
		}
	}

	public Corner FirstWellCorner
	{
		get
		{
			return firstWellCorner;
		}
		set
		{
			if (!((ObservableObject)this).Set<Corner>((Expression<Func<Corner>>)(() => FirstWellCorner), ref firstWellCorner, value))
			{
				return;
			}
			if (rectangularRackPartialDuplicate != null)
			{
				rectangularRackPartialDuplicate.RectangularDefaultSequence.StartCorner = firstWellCorner;
			}
			if (firstWellCorner == Corner.BackLeft)
			{
				if (incDirection == IncrementDirection.RowFirst)
				{
					SequenceImage = "/Images/BackByRow500x500.png";
				}
				else
				{
					SequenceImage = "/Images/BackByColumn500x500.png";
				}
			}
			else if (incDirection == IncrementDirection.RowFirst)
			{
				SequenceImage = "/Images/FrontByRow500x500.png";
			}
			else
			{
				SequenceImage = "/Images/FrontByColumn500x500.png";
			}
			if (!staggerEnabled)
			{
				return;
			}
			if (firstWellCorner == Corner.BackLeft)
			{
				if (staggerDirection == OffsetDirection.In)
				{
					StaggerImage = "/Images/StaggerInBack500x500.png";
				}
				else
				{
					StaggerImage = "/Images/StaggerOutBack500x500.png";
				}
			}
			else if (staggerDirection == OffsetDirection.In)
			{
				StaggerImage = "/Images/StaggerInFront500x500.png";
			}
			else
			{
				StaggerImage = "/Images/StaggerOutFront500x500.png";
			}
		}
	}

	public IncrementDirection IncDirection
	{
		get
		{
			return incDirection;
		}
		set
		{
			if (!((ObservableObject)this).Set<IncrementDirection>((Expression<Func<IncrementDirection>>)(() => IncDirection), ref incDirection, value))
			{
				return;
			}
			if (rectangularRackPartialDuplicate != null)
			{
				rectangularRackPartialDuplicate.RectangularDefaultSequence.IncrementDirection = incDirection;
			}
			if (incDirection == IncrementDirection.RowFirst)
			{
				if (firstWellCorner == Corner.BackLeft)
				{
					SequenceImage = "/Images/BackByRow500x500.png";
				}
				else
				{
					SequenceImage = "/Images/FrontByRow500x500.png";
				}
			}
			else if (firstWellCorner == Corner.BackLeft)
			{
				SequenceImage = "/Images/BackByColumn500x500.png";
			}
			else
			{
				SequenceImage = "/Images/FrontByColumn500x500.png";
			}
		}
	}

	public bool UseDefaultFirstValue
	{
		get
		{
			return useDefaultFirstValue;
		}
		set
		{
			if (((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => UseDefaultFirstValue), ref useDefaultFirstValue, value) && rectangularRackPartialDuplicate != null)
			{
				rectangularRackPartialDuplicate.RectangularDefaultSequence.UseDefaultStartValue = useDefaultFirstValue;
			}
		}
	}

	public string SequenceImage
	{
		get
		{
			return sequenceImage;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => SequenceImage), ref sequenceImage, value);
		}
	}

	public string StaggerImage
	{
		get
		{
			return staggerImage;
		}
		set
		{
			((ObservableObject)this).Set<string>((Expression<Func<string>>)(() => StaggerImage), ref staggerImage, value);
		}
	}

	public DialogRackRegularPatternViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogRackRegularPatternSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
	}

	~DialogRackRegularPatternViewModel()
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
		loadedRectangularRack = loadedLabware as RectangularRack;
		RectangularRackPartialDuplicate = new RectangularRack();
		rectangularRackPartialDuplicate.ReadOnly = loadedRectangularRack.ReadOnly;
		rectangularRackPartialDuplicate.Stagger = new Stagger(loadedRectangularRack.Stagger);
		rectangularRackPartialDuplicate.RectangularDefaultSequence = new RectangularDefaultSequence(loadedRectangularRack.RectangularDefaultSequence);
		rectangularRackPartialDuplicate.RowSpacing = loadedRectangularRack.RowSpacing;
		rectangularRackPartialDuplicate.ColumnSpacing = loadedRectangularRack.ColumnSpacing;
		rectangularRackPartialDuplicate.Rows = loadedRectangularRack.Rows;
		rectangularRackPartialDuplicate.Columns = loadedRectangularRack.Columns;
		rectangularRackPartialDuplicate.BoundaryOffsets = new Offsets(loadedRectangularRack.BoundaryOffsets);
		InitializeImages();
		FirstWellCorner = rectangularRackPartialDuplicate.RectangularDefaultSequence.StartCorner;
		IncDirection = rectangularRackPartialDuplicate.RectangularDefaultSequence.IncrementDirection;
		UseDefaultFirstValue = rectangularRackPartialDuplicate.RectangularDefaultSequence.UseDefaultStartValue;
		StaggerEnabled = rectangularRackPartialDuplicate.Stagger.Enabled;
		StaggerDirection = rectangularRackPartialDuplicate.Stagger.OffsetDirection;
		RectangularRackPartialDuplicate.DataChanged = false;
	}

	private void ExecuteCancelCloseButton()
	{
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: false);
		InvokeRequestCloseDialog(e);
		loadedRectangularRack = null;
		RectangularRackPartialDuplicate = null;
	}

	private void ExecuteSaveButton()
	{
		loadedRectangularRack.Stagger = new Stagger(rectangularRackPartialDuplicate.Stagger);
		loadedRectangularRack.RectangularDefaultSequence = new RectangularDefaultSequence(rectangularRackPartialDuplicate.RectangularDefaultSequence);
		loadedRectangularRack.RowSpacing = rectangularRackPartialDuplicate.RowSpacing;
		loadedRectangularRack.ColumnSpacing = rectangularRackPartialDuplicate.ColumnSpacing;
		loadedRectangularRack.Rows = rectangularRackPartialDuplicate.Rows;
		loadedRectangularRack.Columns = rectangularRackPartialDuplicate.Columns;
		loadedRectangularRack.BoundaryOffsets = new Offsets(rectangularRackPartialDuplicate.BoundaryOffsets);
		RequestCloseDialogEventArgs e = new RequestCloseDialogEventArgs(dialogresult: true);
		InvokeRequestCloseDialog(e);
		loadedRectangularRack = null;
		RectangularRackPartialDuplicate = null;
	}

	private void InitializeImages()
	{
		if (rectangularRackPartialDuplicate.RectangularDefaultSequence.StartCorner == Corner.BackLeft)
		{
			if (rectangularRackPartialDuplicate.RectangularDefaultSequence.IncrementDirection == IncrementDirection.RowFirst)
			{
				SequenceImage = "/Images/BackByRow500x500.png";
			}
			else
			{
				SequenceImage = "/Images/BackByColumn500x500.png";
			}
		}
		else if (rectangularRackPartialDuplicate.RectangularDefaultSequence.IncrementDirection == IncrementDirection.RowFirst)
		{
			SequenceImage = "/Images/FrontByRow500x500.png";
		}
		else
		{
			SequenceImage = "/Images/FrontByColumn500x500.png";
		}
		if (rectangularRackPartialDuplicate.Stagger.Enabled)
		{
			if (rectangularRackPartialDuplicate.RectangularDefaultSequence.StartCorner == Corner.BackLeft)
			{
				if (rectangularRackPartialDuplicate.Stagger.OffsetDirection == OffsetDirection.In)
				{
					StaggerImage = "/Images/StaggerInBack500x500.png";
				}
				else
				{
					StaggerImage = "/Images/StaggerOutBack500x500.png";
				}
			}
			else if (rectangularRackPartialDuplicate.Stagger.OffsetDirection == OffsetDirection.In)
			{
				StaggerImage = "/Images/StaggerInFront500x500.png";
			}
			else
			{
				StaggerImage = "/Images/StaggerOutFront500x500.png";
			}
		}
		else
		{
			StaggerImage = "/Images/NoStagger500x500.png";
		}
	}
}
