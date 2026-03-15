using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using System.Windows.Media;
using MahApps.Metro.Controls;

namespace HxLabwrEd2.View;

public class LoadedContainerPropertiesView : UserControl, IComponentConnector
{
	internal ToggleSwitch ToggleLLD;

	internal TextBlock TxtBlockLLDSeek;

	internal TextBlock TxtBlockLLDSeekUnit;

	internal TextBlock TxtBlockLLDSensitivity;

	internal ToggleSwitch ToggleWick;

	internal TextBlock TxtBlockWickHeight;

	internal TextBlock TxtBlockWickHeightUnit;

	internal TextBlock TxtBlockWickWallDistance;

	internal TextBlock TxtBlockWickWallDistanceUnit;

	private bool _contentLoaded;

	public LoadedContainerPropertiesView()
	{
		InitializeComponent();
	}

	private void UserControl_Loaded(object sender, RoutedEventArgs e)
	{
		if (ToggleLLD.IsChecked == true)
		{
			EnableLLDTxtBlocks();
		}
		else
		{
			DisableLLDTxtBlocks();
		}
		if (ToggleWick.IsChecked == true)
		{
			EnableWickTxtBlocks();
		}
		else
		{
			DisableWickTxtBlocks();
		}
	}

	private void ToggleLLD_Checked(object sender, RoutedEventArgs e)
	{
		EnableLLDTxtBlocks();
	}

	private void ToggleLLD_Unchecked(object sender, RoutedEventArgs e)
	{
		DisableLLDTxtBlocks();
	}

	private void ToggleWick_Checked(object sender, RoutedEventArgs e)
	{
		EnableWickTxtBlocks();
	}

	private void ToggleWick_Unchecked(object sender, RoutedEventArgs e)
	{
		DisableWickTxtBlocks();
	}

	private void EnableLLDTxtBlocks()
	{
		TxtBlockLLDSeek.Foreground = Brushes.Black;
		TxtBlockLLDSeekUnit.Foreground = Brushes.Black;
		TxtBlockLLDSensitivity.Foreground = Brushes.Black;
	}

	private void DisableLLDTxtBlocks()
	{
		TxtBlockLLDSeek.Foreground = Brushes.Gray;
		TxtBlockLLDSeekUnit.Foreground = Brushes.Gray;
		TxtBlockLLDSensitivity.Foreground = Brushes.Gray;
	}

	private void EnableWickTxtBlocks()
	{
		TxtBlockWickHeight.Foreground = Brushes.Black;
		TxtBlockWickHeightUnit.Foreground = Brushes.Black;
		TxtBlockWickWallDistance.Foreground = Brushes.Black;
		TxtBlockWickWallDistanceUnit.Foreground = Brushes.Black;
	}

	private void DisableWickTxtBlocks()
	{
		TxtBlockWickHeight.Foreground = Brushes.Gray;
		TxtBlockWickHeightUnit.Foreground = Brushes.Gray;
		TxtBlockWickWallDistance.Foreground = Brushes.Gray;
		TxtBlockWickWallDistanceUnit.Foreground = Brushes.Gray;
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedcontainerpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_004f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0059: Expected O, but got Unknown
		//IL_00b1: Unknown result type (might be due to invalid IL or missing references)
		//IL_00bb: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			((LoadedContainerPropertiesView)target).Loaded += UserControl_Loaded;
			break;
		case 2:
			ToggleLLD = (ToggleSwitch)target;
			ToggleLLD.Checked += ToggleLLD_Checked;
			ToggleLLD.Unchecked += ToggleLLD_Unchecked;
			break;
		case 3:
			TxtBlockLLDSeek = (TextBlock)target;
			break;
		case 4:
			TxtBlockLLDSeekUnit = (TextBlock)target;
			break;
		case 5:
			TxtBlockLLDSensitivity = (TextBlock)target;
			break;
		case 6:
			ToggleWick = (ToggleSwitch)target;
			ToggleWick.Checked += ToggleWick_Checked;
			ToggleWick.Unchecked += ToggleWick_Unchecked;
			break;
		case 7:
			TxtBlockWickHeight = (TextBlock)target;
			break;
		case 8:
			TxtBlockWickHeightUnit = (TextBlock)target;
			break;
		case 9:
			TxtBlockWickWallDistance = (TextBlock)target;
			break;
		case 10:
			TxtBlockWickWallDistanceUnit = (TextBlock)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
