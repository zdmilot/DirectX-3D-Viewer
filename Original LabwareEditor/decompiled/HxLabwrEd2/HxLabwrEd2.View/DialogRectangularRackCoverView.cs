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

public class DialogRectangularRackCoverView : UserControl, IComponentConnector
{
	internal DialogRectangularRackCoverView RackCoverView;

	internal Button ButtonCancel;

	internal Button ButtonOK;

	internal Button ButtonClose;

	internal TextBox BitmapTextBox;

	internal TextBox ModelTextBox;

	internal ToggleSwitch ToggleSwitchOverrideExtent;

	internal TextBlock TextBlockExtentX;

	internal TextBlock TextBlockExtentXmm;

	internal TextBlock TextBlockExtentY;

	internal TextBlock TextBlockExtentYmm;

	private bool _contentLoaded;

	public DialogRectangularRackCoverView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RackCoverBitmapScroll", (Action<NotificationMessage>)delegate
		{
			BitmapScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"RackCoverModelScroll", (Action<NotificationMessage>)delegate
		{
			ModelScroll();
		}, false);
	}

	private void BitmapScroll()
	{
		BitmapTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void ModelScroll()
	{
		ModelTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void BitmapTextBox_Loaded(object sender, RoutedEventArgs e)
	{
		BitmapScroll();
	}

	private void ModelTextBox_Loaded(object sender, RoutedEventArgs e)
	{
		ModelScroll();
	}

	private void RackCoverView_Loaded(object sender, RoutedEventArgs e)
	{
		if (ToggleSwitchOverrideExtent.IsChecked.HasValue && ToggleSwitchOverrideExtent.IsChecked.Value)
		{
			OverrideExtentEnabled();
		}
		else
		{
			OverrideExtentDisabled();
		}
	}

	private void OverrideExtentEnabled()
	{
		TextBlockExtentX.Foreground = Brushes.Black;
		TextBlockExtentXmm.Foreground = Brushes.Black;
		TextBlockExtentY.Foreground = Brushes.Black;
		TextBlockExtentYmm.Foreground = Brushes.Black;
	}

	private void OverrideExtentDisabled()
	{
		TextBlockExtentX.Foreground = Brushes.Gray;
		TextBlockExtentXmm.Foreground = Brushes.Gray;
		TextBlockExtentY.Foreground = Brushes.Gray;
		TextBlockExtentYmm.Foreground = Brushes.Gray;
	}

	private void ToggleSwitchOverrideExtent_IsCheckedChanged(object sender, EventArgs e)
	{
		if (ToggleSwitchOverrideExtent.IsChecked.HasValue && ToggleSwitchOverrideExtent.IsChecked.Value)
		{
			OverrideExtentEnabled();
		}
		else
		{
			OverrideExtentDisabled();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/dialogrectangularrackcoverview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_00ce: Unknown result type (might be due to invalid IL or missing references)
		//IL_00d8: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			RackCoverView = (DialogRectangularRackCoverView)target;
			RackCoverView.Loaded += RackCoverView_Loaded;
			break;
		case 2:
			ButtonCancel = (Button)target;
			break;
		case 3:
			ButtonOK = (Button)target;
			break;
		case 4:
			ButtonClose = (Button)target;
			break;
		case 5:
			BitmapTextBox = (TextBox)target;
			BitmapTextBox.Loaded += BitmapTextBox_Loaded;
			break;
		case 6:
			ModelTextBox = (TextBox)target;
			ModelTextBox.Loaded += ModelTextBox_Loaded;
			break;
		case 7:
			ToggleSwitchOverrideExtent = (ToggleSwitch)target;
			ToggleSwitchOverrideExtent.IsCheckedChanged += ToggleSwitchOverrideExtent_IsCheckedChanged;
			break;
		case 8:
			TextBlockExtentX = (TextBlock)target;
			break;
		case 9:
			TextBlockExtentXmm = (TextBlock)target;
			break;
		case 10:
			TextBlockExtentY = (TextBlock)target;
			break;
		case 11:
			TextBlockExtentYmm = (TextBlock)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
