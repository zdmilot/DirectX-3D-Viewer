using System;

namespace HxLabwrEd2.DialogWindows;

public interface IWeakEventHandler<TE> where TE : EventArgs
{
	EventHandler<TE> Handler { get; }
}
