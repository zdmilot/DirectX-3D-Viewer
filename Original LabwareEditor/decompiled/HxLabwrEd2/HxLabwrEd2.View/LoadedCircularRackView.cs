using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using System.Windows.Media;
using GalaSoft.MvvmLight.Messaging;
using MahApps.Metro.Controls;

namespace HxLabwrEd2.View;

public class LoadedCircularRackView : UserControl, IComponentConnector
{
	internal LoadedCircularRackView LoadedRackView;

	internal Expander ExpanderOne;

	internal Expander ExpanderTwo;

	internal TextBlock TxtBlockHeightUnit;

	internal TextBlock TxtBlockClearanceHeightUnit;

	internal TextBlock TxtBlockStackHeightUnit;

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

	public LoadedCircularRackView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"CircularRackContainerPathScroll", (Action<NotificationMessage>)delegate
		{
			ContainerPathScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"LoadedCircularRackRefreshDelayedBindings", (Action<NotificationMessage>)delegate
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

	private void RefreshDelayedBindings()
	{
		ContainerPathTextBox.GetBindingExpression(TextBox.TextProperty)?.UpdateSource();
		((FrameworkElement)(object)SingleContainerOffsetXdoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)SingleContainerOffsetYdoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)WellDiameterDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
	}

	private void LoadedRackView_Loaded(object sender, RoutedEventArgs e)
	{
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

	private void EmptyRdButtonChecked(object sender, RoutedEventArgs e)
	{
		RadioButton obj = sender as RadioButton;
		if (obj != null && obj.IsChecked == true)
		{
			EmptyTxtBlocks();
		}
	}

	private void SingleRdButtonChecked(object sender, RoutedEventArgs e)
	{
		RadioButton obj = sender as RadioButton;
		if (obj != null && obj.IsChecked == true)
		{
			SingleTxtBlocks();
		}
	}

	private void MultiRdButtonChecked(object sender, RoutedEventArgs e)
	{
		RadioButton obj = sender as RadioButton;
		if (obj != null && obj.IsChecked == true)
		{
			MultiTxtBlocks();
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
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedcircularrackview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_012d: Unknown result type (might be due to invalid IL or missing references)
		//IL_0137: Expected O, but got Unknown
		//IL_01c3: Unknown result type (might be due to invalid IL or missing references)
		//IL_01cd: Expected O, but got Unknown
		//IL_01ea: Unknown result type (might be due to invalid IL or missing references)
		//IL_01f4: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			LoadedRackView = (LoadedCircularRackView)target;
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
			TxtBlockHeightUnit = (TextBlock)target;
			break;
		case 5:
			TxtBlockClearanceHeightUnit = (TextBlock)target;
			break;
		case 6:
			TxtBlockStackHeightUnit = (TextBlock)target;
			break;
		case 7:
			ExpanderThree = (Expander)target;
			break;
		case 8:
			RdBtnEmpty = (RadioButton)target;
			RdBtnEmpty.Checked += EmptyRdButtonChecked;
			break;
		case 9:
			TxtBlockEmptyDiameter = (TextBlock)target;
			break;
		case 10:
			WellDiameterDoubleUpDown = (NumericUpDown)target;
			break;
		case 11:
			TxtBlockEmptyDiameterUnit = (TextBlock)target;
			break;
		case 12:
			RdBtnSingle = (RadioButton)target;
			RdBtnSingle.Checked += SingleRdButtonChecked;
			break;
		case 13:
			TxtBlockSingleFilePath = (TextBlock)target;
			break;
		case 14:
			ContainerPathTextBox = (TextBox)target;
			ContainerPathTextBox.Loaded += ContainerPathTextBox_Loaded;
			break;
		case 15:
			TxtBlockSingleOffsetZ = (TextBlock)target;
			break;
		case 16:
			TxtBlockSingleOffsetZUnit = (TextBlock)target;
			break;
		case 17:
			TxtBlockSingleOffsetX = (TextBlock)target;
			break;
		case 18:
			SingleContainerOffsetXdoubleUpDown = (NumericUpDown)target;
			break;
		case 19:
			TxtBlockSingleOffsetXUnit = (TextBlock)target;
			break;
		case 20:
			TxtBlockSingleOffsetY = (TextBlock)target;
			break;
		case 21:
			SingleContainerOffsetYdoubleUpDown = (NumericUpDown)target;
			break;
		case 22:
			TxtBlockSingleOffsetYUnit = (TextBlock)target;
			break;
		case 23:
			TxtBlockSingleConnected = (TextBlock)target;
			break;
		case 24:
			((RadioButton)target).Checked += MultiRdButtonChecked;
			break;
		case 25:
			ExpanderFour = (Expander)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
