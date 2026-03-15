using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;

namespace HxLabwrEd2.View;

public class CreationMicrotiterPlatePropertiesView : UserControl, IComponentConnector
{
	internal CreationMicrotiterPlatePropertiesView MicrotiterPlateCreation;

	internal TextBox ContainerPathTextBox;

	private bool _contentLoaded;

	public CreationMicrotiterPlatePropertiesView()
	{
		InitializeComponent();
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
		ContainerPathTextBox.GetBindingExpression(TextBox.TextProperty).UpdateSource();
	}

	private void MicrotiterPlateCreation_Loaded(object sender, RoutedEventArgs e)
	{
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"MicrotiterPlateContainerPathScroll", (Action<NotificationMessage>)delegate
		{
			ContainerPathScroll();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"MicrotiterCreationRefreshDelayedBindings", (Action<NotificationMessage>)delegate
		{
			RefreshDelayedBindings();
		}, false);
	}

	private void MicrotiterPlateCreation_Unloaded(object sender, RoutedEventArgs e)
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
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/creationmicrotiterplatepropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[EditorBrowsable(EditorBrowsableState.Never)]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[DebuggerNonUserCode]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			MicrotiterPlateCreation = (CreationMicrotiterPlatePropertiesView)target;
			MicrotiterPlateCreation.Loaded += MicrotiterPlateCreation_Loaded;
			MicrotiterPlateCreation.Unloaded += MicrotiterPlateCreation_Unloaded;
			break;
		case 2:
			ContainerPathTextBox = (TextBox)target;
			ContainerPathTextBox.Loaded += ContainerPathTextBox_Loaded;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
