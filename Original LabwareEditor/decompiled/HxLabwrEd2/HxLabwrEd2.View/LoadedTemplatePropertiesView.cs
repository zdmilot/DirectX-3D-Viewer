using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Markup;
using GalaSoft.MvvmLight.Messaging;
using MahApps.Metro.Controls;

namespace HxLabwrEd2.View;

public class LoadedTemplatePropertiesView : UserControl, IComponentConnector
{
	internal NumericUpDown WidthDoubleUpDown;

	internal NumericUpDown LengthDoubleUpDown;

	private bool _contentLoaded;

	public LoadedTemplatePropertiesView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"LoadedTemplateRefreshDelayedBindings", (Action<NotificationMessage>)delegate
		{
			RefreshDelayedBindings();
		}, false);
	}

	private void DoubleUpDown_SourceUpdated(object sender, DataTransferEventArgs e)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0019: Expected O, but got Unknown
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"RedrawTemplate");
	}

	private void RefreshDelayedBindings()
	{
		((FrameworkElement)(object)WidthDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)LengthDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
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
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/loadedtemplatepropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	[DebuggerNonUserCode]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_000c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0016: Expected O, but got Unknown
		//IL_0019: Unknown result type (might be due to invalid IL or missing references)
		//IL_0023: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			WidthDoubleUpDown = (NumericUpDown)target;
			break;
		case 2:
			LengthDoubleUpDown = (NumericUpDown)target;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
