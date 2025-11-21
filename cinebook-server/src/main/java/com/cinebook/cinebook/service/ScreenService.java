package com.cinebook.cinebook.service;

import com.cinebook.cinebook.dto.ScreenWithSeatsDTO;
import com.cinebook.cinebook.model.Screen;
import java.util.List;

public interface ScreenService {
    Screen createScreen(Screen screen);
    List<ScreenWithSeatsDTO> getScreensByTheater(Long theaterId);
}
