using System;

namespace HxLabwrEd2.DialogWindows;

public delegate void UnregisterCallback<TE>(EventHandler<TE> eventHandler) where TE : EventArgs;
