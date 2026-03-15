using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;

namespace HxLabwrEd2.View;

public class LoadedContainerGeneralPropertiesView : UserControl, IComponentConnector
{
	internal LoadedContainerGeneralPropertiesView GeneralProperties;

	internal TextBox NameTextBox;

	internal TextBox ModelTextBox;

	private bool _contentLoaded;

	public LoadedContainerGeneralPropertiesView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"ContainerGeneralPropertiesModelScroll", (Action<NotificationMessage>)delegate
		{
			ModelScroll();
		}, false);
	}

	private void ModelTextBox_Loaded(object sender, RoutedEventArgs e)
	{
		ModelScroll();
	}

	private void ModelScroll()
	{
		ModelTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	public void InitializeComponent()
	{
		if (!_contentLoaded)
		{
			_contentLoaded = true;
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedcontainergeneralpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		switch (connectionId)
		{
		case 1:
			GeneralProperties = (LoadedContainerGeneralPropertiesView)target;
			break;
		case 2:
			NameTextBox = (TextBox)target;
			break;
		case 3:
			ModelTextBox = (TextBox)target;
			ModelTextBox.Loaded += ModelTextBox_Loaded;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
