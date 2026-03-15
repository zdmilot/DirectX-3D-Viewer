using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;

namespace HxLabwrEd2.View;

public class NimbusFlexCarrierPropertiesView : UserControl, IComponentConnector
{
	internal TextBox NameTextBox;

	internal TextBox PictureTextBox;

	internal TextBox BitmapTextBox;

	private bool _contentLoaded;

	public NimbusFlexCarrierPropertiesView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"NimbusFlexPictureScroll", (Action<NotificationMessage>)delegate
		{
			NimbusFlexPictureScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"NimbusFlexBitmapScroll", (Action<NotificationMessage>)delegate
		{
			NimbusFlexBitmapScroll();
		}, false);
	}

	private void NimbusFlexPictureScroll()
	{
		PictureTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void NimbusFlexBitmapScroll()
	{
		BitmapTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void UserControl_Unloaded(object sender, RoutedEventArgs e)
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
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/nimbusflexcarrierpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[EditorBrowsable(EditorBrowsableState.Never)]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			((NimbusFlexCarrierPropertiesView)target).Unloaded += UserControl_Unloaded;
			break;
		case 2:
			NameTextBox = (TextBox)target;
			break;
		case 3:
			PictureTextBox = (TextBox)target;
			break;
		case 4:
			BitmapTextBox = (TextBox)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
