using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Markup;
using System.Windows.Media;
using GalaSoft.MvvmLight.Messaging;
using MahApps.Metro.Controls;

namespace HxLabwrEd2.View;

public class CreationRackContainerPropertiesView : UserControl, IComponentConnector
{
	internal CreationRackContainerPropertiesView CreationRackContainerView;

	internal RadioButton RdBtnEmpty;

	internal TextBlock TxtBlockEmptyDiameter;

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

	internal RadioButton RdBtnMulti;

	private bool _contentLoaded;

	public CreationRackContainerPropertiesView()
	{
		InitializeComponent();
	}

	private void TextBox_SourceUpdated(object sender, DataTransferEventArgs e)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0019: Expected O, but got Unknown
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"RackContainerUpdateSingleContainer");
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
	}

	private void ContainerPathScroll()
	{
		ContainerPathTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void CreationRackContainerView_Loaded(object sender, RoutedEventArgs e)
	{
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RackContainerPathScroll", (Action<NotificationMessage>)delegate
		{
			ContainerPathScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"CreationRackContainerRefreshDelayedBindings", (Action<NotificationMessage>)delegate
		{
			RefreshDelayedBindings();
		}, false);
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

	private void CreationRackContainerView_Unloaded(object sender, RoutedEventArgs e)
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

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/creationrackcontainerpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_015f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0169: Expected O, but got Unknown
		//IL_0186: Unknown result type (might be due to invalid IL or missing references)
		//IL_0190: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			CreationRackContainerView = (CreationRackContainerPropertiesView)target;
			CreationRackContainerView.Loaded += CreationRackContainerView_Loaded;
			CreationRackContainerView.Unloaded += CreationRackContainerView_Unloaded;
			break;
		case 2:
			RdBtnEmpty = (RadioButton)target;
			RdBtnEmpty.Checked += EmptyRdButtonChecked;
			break;
		case 3:
			TxtBlockEmptyDiameter = (TextBlock)target;
			break;
		case 4:
			TxtBlockEmptyDiameterUnit = (TextBlock)target;
			break;
		case 5:
			RdBtnSingle = (RadioButton)target;
			RdBtnSingle.Checked += SingleRdButtonChecked;
			break;
		case 6:
			TxtBlockSingleFilePath = (TextBlock)target;
			break;
		case 7:
			ContainerPathTextBox = (TextBox)target;
			ContainerPathTextBox.SourceUpdated += TextBox_SourceUpdated;
			ContainerPathTextBox.Loaded += ContainerPathTextBox_Loaded;
			break;
		case 8:
			TxtBlockSingleOffsetZ = (TextBlock)target;
			break;
		case 9:
			TxtBlockSingleOffsetZUnit = (TextBlock)target;
			break;
		case 10:
			TxtBlockSingleOffsetX = (TextBlock)target;
			break;
		case 11:
			SingleContainerOffsetXdoubleUpDown = (NumericUpDown)target;
			break;
		case 12:
			TxtBlockSingleOffsetXUnit = (TextBlock)target;
			break;
		case 13:
			TxtBlockSingleOffsetY = (TextBlock)target;
			break;
		case 14:
			SingleContainerOffsetYdoubleUpDown = (NumericUpDown)target;
			break;
		case 15:
			TxtBlockSingleOffsetYUnit = (TextBlock)target;
			break;
		case 16:
			TxtBlockSingleConnected = (TextBlock)target;
			break;
		case 17:
			RdBtnMulti = (RadioButton)target;
			RdBtnMulti.Checked += MultiRdButtonChecked;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
