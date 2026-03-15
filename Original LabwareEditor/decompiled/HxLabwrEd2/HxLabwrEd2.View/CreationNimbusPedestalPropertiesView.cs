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

public class CreationNimbusPedestalPropertiesView : UserControl, IComponentConnector
{
	internal CreationNimbusPedestalPropertiesView NimbusPedestalPropertiesView;

	internal NumericUpDown WidthDoubleUpDown;

	internal TextBox LabelTextBox;

	internal NumericUpDown SiteWidthDoubleUpDown;

	internal NumericUpDown SiteLengthDoubleUpDown;

	internal NumericUpDown SiteXOffsetDoubleUpDown;

	internal NumericUpDown SiteYOffsetDoubleUpDown;

	internal NumericUpDown SiteZOffsetDoubleUpDown;

	internal TextBox AssignedRackTextBox;

	private bool _contentLoaded;

	public CreationNimbusPedestalPropertiesView()
	{
		InitializeComponent();
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"NimbusPedestalRefreshDelayedBindings", (Action<NotificationMessage>)delegate
		{
			RefreshDelayedBindings();
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"NiimbusPedestalPathScroll", (Action<NotificationMessage>)delegate
		{
			ScrollFilePath();
		}, false);
	}

	private void DoubleUpDown_SourceUpdated(object sender, DataTransferEventArgs e)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0019: Expected O, but got Unknown
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"RedrawNimbusPedestal");
	}

	private void CheckBox_SourceUpdated(object sender, DataTransferEventArgs e)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0019: Expected O, but got Unknown
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"RedrawNimbusPedestal");
	}

	private void TextBox_SourceUpdated(object sender, DataTransferEventArgs e)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0019: Expected O, but got Unknown
		Messenger.Default.Send<NotificationMessage>(new NotificationMessage(""), (object)"UpdateLabwareAndRedrawNimbusPedestal");
	}

	private void ScrollFilePath()
	{
		AssignedRackTextBox.ScrollToHorizontalOffset(double.PositiveInfinity);
	}

	private void TextBox_Loaded(object sender, RoutedEventArgs e)
	{
		ScrollFilePath();
	}

	private void RefreshDelayedBindings()
	{
		LabelTextBox.GetBindingExpression(TextBox.TextProperty).UpdateSource();
		((FrameworkElement)(object)SiteWidthDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)SiteLengthDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)SiteXOffsetDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)SiteYOffsetDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		((FrameworkElement)(object)SiteZOffsetDoubleUpDown).GetBindingExpression(NumericUpDown.ValueProperty).UpdateSource();
		AssignedRackTextBox.GetBindingExpression(TextBox.TextProperty).UpdateSource();
	}

	private void NimbusPedestalPropertiesView_Unloaded(object sender, RoutedEventArgs e)
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
			Uri resourceLocator = new Uri("/HxLabwrEd2;V6.0.0.0;component/view/creationnimbuspedestalpropertiesview.xaml", UriKind.Relative);
			Application.LoadComponent(this, resourceLocator);
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("PresentationBuildTasks", "4.0.0.0")]
	[EditorBrowsable(EditorBrowsableState.Never)]
	void IComponentConnector.Connect(int connectionId, object target)
	{
		//IL_0063: Unknown result type (might be due to invalid IL or missing references)
		//IL_006d: Expected O, but got Unknown
		//IL_00c4: Unknown result type (might be due to invalid IL or missing references)
		//IL_00ce: Expected O, but got Unknown
		//IL_00e8: Unknown result type (might be due to invalid IL or missing references)
		//IL_00f2: Expected O, but got Unknown
		//IL_010c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0116: Expected O, but got Unknown
		//IL_0130: Unknown result type (might be due to invalid IL or missing references)
		//IL_013a: Expected O, but got Unknown
		//IL_0154: Unknown result type (might be due to invalid IL or missing references)
		//IL_015e: Expected O, but got Unknown
		//IL_01b2: Unknown result type (might be due to invalid IL or missing references)
		//IL_01c8: Expected O, but got Unknown
		switch (connectionId)
		{
		case 1:
			NimbusPedestalPropertiesView = (CreationNimbusPedestalPropertiesView)target;
			NimbusPedestalPropertiesView.Unloaded += NimbusPedestalPropertiesView_Unloaded;
			break;
		case 2:
			WidthDoubleUpDown = (NumericUpDown)target;
			break;
		case 3:
			LabelTextBox = (TextBox)target;
			LabelTextBox.SourceUpdated += TextBox_SourceUpdated;
			break;
		case 4:
			((CheckBox)target).SourceUpdated += CheckBox_SourceUpdated;
			break;
		case 5:
			((CheckBox)target).SourceUpdated += CheckBox_SourceUpdated;
			break;
		case 6:
			SiteWidthDoubleUpDown = (NumericUpDown)target;
			((FrameworkElement)(object)SiteWidthDoubleUpDown).SourceUpdated += DoubleUpDown_SourceUpdated;
			break;
		case 7:
			SiteLengthDoubleUpDown = (NumericUpDown)target;
			((FrameworkElement)(object)SiteLengthDoubleUpDown).SourceUpdated += DoubleUpDown_SourceUpdated;
			break;
		case 8:
			SiteXOffsetDoubleUpDown = (NumericUpDown)target;
			((FrameworkElement)(object)SiteXOffsetDoubleUpDown).SourceUpdated += DoubleUpDown_SourceUpdated;
			break;
		case 9:
			SiteYOffsetDoubleUpDown = (NumericUpDown)target;
			((FrameworkElement)(object)SiteYOffsetDoubleUpDown).SourceUpdated += DoubleUpDown_SourceUpdated;
			break;
		case 10:
			SiteZOffsetDoubleUpDown = (NumericUpDown)target;
			((FrameworkElement)(object)SiteZOffsetDoubleUpDown).SourceUpdated += DoubleUpDown_SourceUpdated;
			break;
		case 11:
			AssignedRackTextBox = (TextBox)target;
			AssignedRackTextBox.SourceUpdated += TextBox_SourceUpdated;
			AssignedRackTextBox.Loaded += TextBox_Loaded;
			break;
		case 12:
			((FrameworkElement)(NumericUpDown)target).SourceUpdated += DoubleUpDown_SourceUpdated;
			break;
		default:
			_contentLoaded = true;
			break;
		}
	}
}
