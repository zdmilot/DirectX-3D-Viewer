using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;

namespace HxLabwrEd2.View;

public class LoadedGeneralPropertiesView : UserControl, IComponentConnector
{
	internal LoadedGeneralPropertiesView GeneralProperties;

	internal TextBox NameTextBox;

	internal TextBox PictureTextBox;

	internal TextBox BitmapTextBox;

	internal TextBox ModelTextBox;

	private bool _contentLoaded;

	public LoadedGeneralPropertiesView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"GeneralPropertiesPictureScroll", (Action<NotificationMessage>)delegate
		{
			PictureScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"GeneralPropertiesBitmapScroll", (Action<NotificationMessage>)delegate
		{
			BitmapScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"GeneralPropertiesModelScroll", (Action<NotificationMessage>)delegate
		{
			ModelScroll();
		}, false);
	}

	private void PictureScroll()
	{
		PictureTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void BitmapScroll()
	{
		BitmapTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void ModelScroll()
	{
		ModelTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void PictureTextBox_Loaded(object sender, RoutedEventArgs e)
	{
		PictureScroll();
	}

	private void BitmapTextBox_Loaded(object sender, RoutedEventArgs e)
	{
		BitmapScroll();
	}

	private void ModelTextBox_Loaded(object sender, RoutedEventArgs e)
	{
		ModelScroll();
	}

	private void GeneralProperties_Unloaded(object sender, RoutedEventArgs e)
	{
		Messenger.Default.Unregister((object)this);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedgeneralpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			GeneralProperties = (LoadedGeneralPropertiesView)target;
			GeneralProperties.Unloaded += GeneralProperties_Unloaded;
			break;
		case 2:
			NameTextBox = (TextBox)target;
			break;
		case 3:
			PictureTextBox = (TextBox)target;
			PictureTextBox.Loaded += PictureTextBox_Loaded;
			break;
		case 4:
			BitmapTextBox = (TextBox)target;
			BitmapTextBox.Loaded += BitmapTextBox_Loaded;
			break;
		case 5:
			ModelTextBox = (TextBox)target;
			ModelTextBox.Loaded += ModelTextBox_Loaded;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
