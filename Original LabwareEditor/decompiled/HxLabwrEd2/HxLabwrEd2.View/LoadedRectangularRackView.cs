using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;
using GalaSoft.MvvmLight.Messaging;
using MahApps.Metro.Controls;

namespace HxLabwrEd2.View;

public class LoadedRectangularRackView : UserControl, IComponentConnector
{
	internal LoadedRectangularRackView LoadedRackView;

	internal Expander ExpanderOne;

	internal Expander ExpanderTwo;

	internal RadioButton RdBtn96;

	internal RadioButton RdBtn384;

	internal RadioButton RdBtn1536;

	internal TextBlock TxtBlockOrientation;

	internal RadioButton RdBtnRegular;

	internal RadioButton RdBtnIrregular;

	internal TextBlock TxtBlockWidth;

	internal NumericUpDown WidthDoubleUpDown;

	internal TextBlock TxtBlockWidthUnit;

	internal TextBlock TxtBlockLength;

	internal NumericUpDown LengthDoubleUpDown;

	internal TextBlock TxtBlockLengthUnit;

	internal Expander ExpanderThree;

	internal RadioButton RdBtnEmpty;

	internal TextBlock TxtBlockEmptyDiameter;

	internal NumericUpDown WellDiameterDoubleUpDown;

	internal TextBlock TxtBlockEmptyDiameterUnit;

	internal RadioButton RdBtnSingle;

	internal TextBlock TxtBlockSingleFilePath;

	internal TextBox ContainerPathTextBox;

	internal TextBlock TxtBlockSingleOffsetZ;

	internal TextBlock TxtBlockSingleOffsetZUnit;

	internal TextBlock TxtBlockSingleOffsetX;

	internal NumericUpDown SingleContainerOffsetXdoubleUpDown;

	internal TextBlock TxtBlockSingleOffsetXUnit;

	internal TextBlock TxtBlockSingleOffsetY;

	internal NumericUpDown SingleContainerOffsetYdoubleUpDown;

	internal TextBlock TxtBlockSingleOffsetYUnit;

	internal TextBlock TxtBlockSingleConnected;

	internal Expander ExpanderFour;

	private bool _contentLoaded;

	public LoadedRectangularRackView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RectangularRackContainerPathScroll", (Action<NotificationMessage>)delegate
		{
			ContainerPathScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"LoadedRectangularRackRefreshDelayedBindings", (Action<NotificationMessage>)delegate
		{
			RefreshDelayedBindings();
		}, false);
	}

	private void ContainerPathScroll()
	{
		ContainerPathTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void ContainerPathTextBox_Loaded(object sender, RoutedEventArgs e)
	{
		ContainerPathScroll();
	}

	private void PlateRdButtonPreviewMouseDown(object sender, MouseButtonEventArgs e)
	{
		RefreshWidthLengthDelayedBindings();
	}

	private void PlateRdButtonMouseEnter(object sender, MouseEventArgs e)
	{
		RefreshWidthLengthDelayedBindings();
	}

	private void RefreshDelayedBindings()
	{
		ContainerPathTextBox.GetBindingExpression(TextBox.TextProperty).UpdateSource();
		((FrameworkElement)(object)SingleContainerOffsetXdoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)SingleContainerOffsetYdoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)WellDiameterDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		RefreshWidthLengthDelayedBindings();
	}

	private void RefreshWidthLengthDelayedBindings()
	{
		((FrameworkElement)(object)WidthDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)LengthDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
	}

	private void LoadedRackView_Loaded(object sender, RoutedEventArgs e)
	{
		if (RdBtnIrregular.IsChecked == true || RdBtnRegular.IsChecked == true)
		{
			OtherTxtBlocks();
		}
		else
		{
			PlateTxtBlocks();
		}
		if (RdBtnEmpty.IsChecked == true)
		{
			EmptyTxtBlocks();
		}
		else if (RdBtnSingle.IsChecked == true)
		{
			SingleTxtBlocks();
		}
		else
		{
			MultiTxtBlocks();
		}
	}

	private void LoadedRackView_Unloaded(object sender, RoutedEventArgs e)
	{
		Messenger.Default.Unregister((object)this);
	}

	private void PlateRdButtonChecked(object sender, RoutedEventArgs e)
	{
		if ((sender as RadioButton).IsChecked == true)
		{
			PlateTxtBlocks();
		}
	}

	private void OtherRdButtonChecked(object sender, RoutedEventArgs e)
	{
		if ((sender as RadioButton).IsChecked == true)
		{
			OtherTxtBlocks();
		}
	}

	private void EmptyRdButtonChecked(object sender, RoutedEventArgs e)
	{
		if ((sender as RadioButton).IsChecked == true)
		{
			EmptyTxtBlocks();
		}
	}

	private void SingleRdButtonChecked(object sender, RoutedEventArgs e)
	{
		if ((sender as RadioButton).IsChecked == true)
		{
			SingleTxtBlocks();
		}
	}

	private void MultiRdButtonChecked(object sender, RoutedEventArgs e)
	{
		if ((sender as RadioButton).IsChecked == true)
		{
			MultiTxtBlocks();
		}
	}

	private void PlateTxtBlocks()
	{
		if (base.IsLoaded)
		{
			TxtBlockOrientation.Foreground = Brushes.Black;
			TxtBlockLength.Foreground = Brushes.Gray;
			TxtBlockLengthUnit.Foreground = Brushes.Gray;
			TxtBlockWidth.Foreground = Brushes.Gray;
			TxtBlockWidthUnit.Foreground = Brushes.Gray;
		}
	}

	private void OtherTxtBlocks()
	{
		if (base.IsLoaded)
		{
			TxtBlockOrientation.Foreground = Brushes.Gray;
			TxtBlockLength.Foreground = Brushes.Black;
			TxtBlockLengthUnit.Foreground = Brushes.Black;
			TxtBlockWidth.Foreground = Brushes.Black;
			TxtBlockWidthUnit.Foreground = Brushes.Black;
		}
	}

	private void EmptyTxtBlocks()
	{
		if (base.IsLoaded)
		{
			TxtBlockEmptyDiameter.Foreground = Brushes.Black;
			TxtBlockEmptyDiameterUnit.Foreground = Brushes.Black;
			TxtBlockSingleConnected.Foreground = Brushes.Gray;
			TxtBlockSingleFilePath.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetX.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetY.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetZ.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetXUnit.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetYUnit.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetZUnit.Foreground = Brushes.Gray;
		}
	}

	private void SingleTxtBlocks()
	{
		if (base.IsLoaded)
		{
			TxtBlockEmptyDiameter.Foreground = Brushes.Gray;
			TxtBlockEmptyDiameterUnit.Foreground = Brushes.Gray;
			TxtBlockSingleConnected.Foreground = Brushes.Black;
			TxtBlockSingleFilePath.Foreground = Brushes.Black;
			TxtBlockSingleOffsetX.Foreground = Brushes.Black;
			TxtBlockSingleOffsetY.Foreground = Brushes.Black;
			TxtBlockSingleOffsetZ.Foreground = Brushes.Black;
			TxtBlockSingleOffsetXUnit.Foreground = Brushes.Black;
			TxtBlockSingleOffsetYUnit.Foreground = Brushes.Black;
			TxtBlockSingleOffsetZUnit.Foreground = Brushes.Black;
		}
	}

	private void MultiTxtBlocks()
	{
		if (base.IsLoaded)
		{
			TxtBlockEmptyDiameter.Foreground = Brushes.Gray;
			TxtBlockEmptyDiameterUnit.Foreground = Brushes.Gray;
			TxtBlockSingleConnected.Foreground = Brushes.Gray;
			TxtBlockSingleFilePath.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetX.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetY.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetZ.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetXUnit.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetYUnit.Foreground = Brushes.Gray;
			TxtBlockSingleOffsetZUnit.Foreground = Brushes.Gray;
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedrectangularrackview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	[DebuggerNonUserCode]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_0244: Unknown result type (might be due to invalid IL or missing references)
		//IL_024e: Expected O, but got Unknown
		//IL_026b: Unknown result type (might be due to invalid IL or missing references)
		//IL_0275: Expected O, but got Unknown
		//IL_02c3: Unknown result type (might be due to invalid IL or missing references)
		//IL_02cd: Expected O, but got Unknown
		//IL_0359: Unknown result type (might be due to invalid IL or missing references)
		//IL_0363: Expected O, but got Unknown
		//IL_0380: Unknown result type (might be due to invalid IL or missing references)
		//IL_038a: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			LoadedRackView = (LoadedRectangularRackView)target;
			LoadedRackView.Loaded += LoadedRackView_Loaded;
			LoadedRackView.Unloaded += LoadedRackView_Unloaded;
			break;
		case 2:
			ExpanderOne = (Expander)target;
			break;
		case 3:
			ExpanderTwo = (Expander)target;
			break;
		case 4:
			RdBtn96 = (RadioButton)target;
			RdBtn96.MouseEnter += PlateRdButtonMouseEnter;
			RdBtn96.PreviewMouseDown += PlateRdButtonPreviewMouseDown;
			RdBtn96.Checked += PlateRdButtonChecked;
			break;
		case 5:
			RdBtn384 = (RadioButton)target;
			RdBtn384.MouseEnter += PlateRdButtonMouseEnter;
			RdBtn384.PreviewMouseDown += PlateRdButtonPreviewMouseDown;
			RdBtn384.Checked += PlateRdButtonChecked;
			break;
		case 6:
			RdBtn1536 = (RadioButton)target;
			RdBtn1536.MouseEnter += PlateRdButtonMouseEnter;
			RdBtn1536.PreviewMouseDown += PlateRdButtonPreviewMouseDown;
			RdBtn1536.Checked += PlateRdButtonChecked;
			break;
		case 7:
			TxtBlockOrientation = (TextBlock)target;
			break;
		case 8:
			RdBtnRegular = (RadioButton)target;
			RdBtnRegular.Checked += OtherRdButtonChecked;
			break;
		case 9:
			RdBtnIrregular = (RadioButton)target;
			RdBtnIrregular.Checked += OtherRdButtonChecked;
			break;
		case 10:
			TxtBlockWidth = (TextBlock)target;
			break;
		case 11:
			WidthDoubleUpDown = (NumericUpDown)target;
			break;
		case 12:
			TxtBlockWidthUnit = (TextBlock)target;
			break;
		case 13:
			TxtBlockLength = (TextBlock)target;
			break;
		case 14:
			LengthDoubleUpDown = (NumericUpDown)target;
			break;
		case 15:
			TxtBlockLengthUnit = (TextBlock)target;
			break;
		case 16:
			ExpanderThree = (Expander)target;
			break;
		case 17:
			RdBtnEmpty = (RadioButton)target;
			RdBtnEmpty.Checked += EmptyRdButtonChecked;
			break;
		case 18:
			TxtBlockEmptyDiameter = (TextBlock)target;
			break;
		case 19:
			WellDiameterDoubleUpDown = (NumericUpDown)target;
			break;
		case 20:
			TxtBlockEmptyDiameterUnit = (TextBlock)target;
			break;
		case 21:
			RdBtnSingle = (RadioButton)target;
			RdBtnSingle.Checked += SingleRdButtonChecked;
			break;
		case 22:
			TxtBlockSingleFilePath = (TextBlock)target;
			break;
		case 23:
			ContainerPathTextBox = (TextBox)target;
			ContainerPathTextBox.Loaded += ContainerPathTextBox_Loaded;
			break;
		case 24:
			TxtBlockSingleOffsetZ = (TextBlock)target;
			break;
		case 25:
			TxtBlockSingleOffsetZUnit = (TextBlock)target;
			break;
		case 26:
			TxtBlockSingleOffsetX = (TextBlock)target;
			break;
		case 27:
			SingleContainerOffsetXdoubleUpDown = (NumericUpDown)target;
			break;
		case 28:
			TxtBlockSingleOffsetXUnit = (TextBlock)target;
			break;
		case 29:
			TxtBlockSingleOffsetY = (TextBlock)target;
			break;
		case 30:
			SingleContainerOffsetYdoubleUpDown = (NumericUpDown)target;
			break;
		case 31:
			TxtBlockSingleOffsetYUnit = (TextBlock)target;
			break;
		case 32:
			TxtBlockSingleConnected = (TextBlock)target;
			break;
		case 33:
			((RadioButton)target).Checked += MultiRdButtonChecked;
			break;
		case 34:
			ExpanderFour = (Expander)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
